import fs from 'node:fs/promises'
import http from 'node:http'
import path from 'node:path'
import process from 'node:process'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(here, '..')
const require = createRequire(import.meta.url)
const { chromium } = require('playwright')

const fsrsModule = await import(path.join(root, 'assets', 'ts-fsrs.umd.js'))
globalThis.FSRS = fsrsModule.default || fsrsModule
await import(path.join(root, 'assets', 'learning-routing.js'))
const routing = globalThis.LingoGrabRouting

const checks = []
function check(group, name, pass, evidence = '') {
  checks.push({ group, name, pass: Boolean(pass), evidence })
}

const answerCases = [
  ['目标答案', 'clarify', { target: 'clarify', acceptedAnswers: ['explain'] }, 'target'],
  ['忽略大小写', 'CLARIFY', { target: 'clarify' }, 'target'],
  ['可接受答案 clarify', 'explain', { target: 'clarify', acceptedAnswers: ['explain'] }, 'acceptable'],
  ['可接受答案 align', 'agree', { target: 'align', acceptedAnswers: ['agree'] }, 'acceptable'],
  ['可接受答案 update', 'report', { target: 'update', acceptedAnswers: ['report'] }, 'acceptable'],
  ['可接受答案 feedback', 'comment', { target: 'feedback', acceptedAnswers: ['comment'] }, 'acceptable'],
  ['可接受短语 review', 'look at', { target: 'review', acceptedAnswers: ['look at'] }, 'acceptable'],
  ['法语请求语气', 'voulez', { target: 'pouvez', acceptedAnswers: ['voulez'] }, 'acceptable'],
  ['法语礼貌程度', 'veux', { target: 'voudrais', acceptedAnswers: ['veux'] }, 'acceptable'],
  ['真正错误', 'banana', { target: 'clarify', acceptedAnswers: ['explain'] }, 'wrong'],
  ['空答案', '', { target: 'clarify' }, 'empty'],
]
for (const [name, value, card, expected] of answerCases) {
  const result = routing.gradeAnswer(value, card)
  check('答案公平性', name, result.kind === expected, `${value || '空'} → ${result.kind}`)
}

const base = new Date('2026-10-07T12:00:00+08:00')
const firstGood = routing.nextReview({ correct: true, firstTry: true, today: base })
check('复习排期', '首次答对进入 FSRS-6', firstGood.algorithm === 'fsrs-6' && firstGood.rating === 'Good' && firstGood.interval > 0 && firstGood.fsrsCard?.reps === 1, JSON.stringify(firstGood))
const firstWrong = routing.nextReview({ correct: false, firstTry: false, today: base })
check('复习排期', '答错记为 Again', firstWrong.algorithm === 'fsrs-6' && firstWrong.rating === 'Again' && firstWrong.interval > 0, JSON.stringify(firstWrong))
const corrected = routing.nextReview({ record: firstWrong, correct: true, firstTry: false, today: base })
check('复习排期', '改正后记为 Hard', corrected.algorithm === 'fsrs-6' && corrected.rating === 'Hard' && corrected.fsrsCard?.reps === 2, JSON.stringify(corrected))
const migratedLegacy = routing.nextReview({ record: { interval: 7, due: '2026-10-07', lastReviewed: '2026-09-30', lastResult: 'first_try' }, correct: true, firstTry: true, today: base })
check('复习排期', '旧固定排期迁移后延续既有进度', migratedLegacy.algorithm === 'fsrs-6' && migratedLegacy.rating === 'Good' && migratedLegacy.fsrsCard?.reps === 2 && migratedLegacy.interval > 1, JSON.stringify(migratedLegacy))

const html = await fs.readFile(path.join(root, 'index.html'), 'utf8')
const adminHtml = await fs.readFile(path.join(root, 'admin.html'), 'utf8')
const staticChecks = [
  ['真实连续天数', html.includes('id="streakCount"') && html.includes('function streak()')],
  ['每日完成页', html.includes('session-complete') && html.includes('这轮练习完成了')],
  ['拾取后可选全部制卡或立即练习', html.includes('data-add-all') && html.includes('data-add-practice') && html.includes('startPickedPractice')],
  ['个人拾取以完整练习卡保存', html.includes("cardType:'practice'") && html.includes('cardVersion:2') && html.includes('normalizePickedCard') && html.includes('pickedToCard')],
  ['拾取卡保留原句并校验溯源', html.includes('sourceSentenceFor') && html.includes('requireTrace:true') && html.includes("example.replace(pattern,'$1___')")],
  ['拾取卡题面转义后再渲染', html.includes('function clozeMarkup') && html.includes('clozeMarkup(c.cloze)') && !html.includes("c.cloze.replace('___'")],
  ['学习记录与到期日', html.includes('studyRecords') && html.includes('lastReviewed')],
  ['学习数据导出', html.includes('id="exportBtn"') && html.includes('lingograb-learning-data.json')],
  ['词书数量口径', html.includes('已校验练习卡') && !html.includes('${d.size.toLocaleString(\'en-US\')} WORDS')],
  ['首次体验包含每日目标', html.includes('data-onboard-goal="3"') && html.includes('data-onboard-goal="12"') && html.includes('先生成自己的练习卡')],
  ['英语词库扩展为百张卡', html.includes('data/en-curated-cards.js') && html.includes('FSRS-6')],
  ['反馈点赞点踩', html.includes('data-reaction="like"') && html.includes('data-reaction="dislike"') && html.includes("accountPost('/feedback'")],
  ['匿名产品埋点', html.includes("e:'lg_visit'") && html.includes("e:'lg_session_complete'") && !html.includes('userAnswer:val')],
  ['LingoGrab 用户运营看板', adminHtml.includes('LingoGrab 用户运营看板') && adminHtml.includes('/lingograb-analytics') && adminHtml.includes('feedbackItems') && adminHtml.includes('demoData')],
  ['看板标注数据起点和北京时间', adminHtml.includes('2026-10-08 16:59') && adminHtml.includes('北京时间，UTC+8') && adminHtml.includes('beijingDay')],
  ['看板不混入学习质量', adminHtml.includes('UV') && adminHtml.includes('访问来源') && adminHtml.includes('稳定性') && !adminHtml.includes('一次答对率') && !adminHtml.includes('延迟回忆表现')],
  ['产品内学习质量', html.includes('我的学习质量')],
  ['三条内容路线导航', html.includes('data-screen="library"') && html.includes('data-screen="smart"') && html.includes('data-screen="import"')],
  ['点赞点踩默认弱化', html.includes('class="reaction-details"') && html.includes('<summary>反馈这段解释</summary>')],
]
for (const [name, pass] of staticChecks) check('产品闭环', name, pass, pass ? '存在对应实现' : '缺少实现')

function contentType(file) {
  if (file.endsWith('.html')) return 'text/html; charset=utf-8'
  if (file.endsWith('.js')) return 'text/javascript; charset=utf-8'
  if (file.endsWith('.txt')) return 'text/plain; charset=utf-8'
  if (file.endsWith('.svg')) return 'image/svg+xml'
  return 'application/octet-stream'
}

const server = http.createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname)
    const requested = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '')
    const file = path.resolve(root, requested)
    if (!file.startsWith(root)) throw new Error('invalid path')
    const data = await fs.readFile(file)
    response.writeHead(200, { 'Content-Type': contentType(file) })
    response.end(data)
  } catch {
    response.writeHead(404)
    response.end('Not found')
  }
})

await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
const port = server.address().port
let browser
try {
  browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
  await page.route('**/api/track', route => route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' }))
  const pageErrors = []
  page.on('pageerror', error => pageErrors.push(String(error)))
  await page.goto(`http://127.0.0.1:${port}`, { waitUntil: 'networkidle' })
  await page.evaluate(() => localStorage.clear())
  await page.reload({ waitUntil: 'networkidle' })

  const traceRules = await page.evaluate(() => ({
    substringRejected: sourceSentenceFor('The report was updated yesterday.', 'update') === '',
    exactAccepted: sourceSentenceFor('Please update the report today.', 'update').includes('Please update'),
    tracedCandidate: validCandidate({ target: 'align', meaning: '达成一致', lang: 'en', level: 'B2', example: 'Invented example.', cloze: 'Invented ___ card.' }, { sourceText: 'We should align before the meeting.', requireTrace: true }),
  }))
  check('拾取制卡规则', '目标表达按完整词或短语匹配', traceRules.substringRejected && traceRules.exactAccepted, JSON.stringify(traceRules))
  check('拾取制卡规则', 'AI 题面强制从来源原句重建', traceRules.tracedCandidate?.example === 'We should align before the meeting.' && traceRules.tracedCandidate?.cloze === '', JSON.stringify(traceRules.tracedCandidate))

  const mergedDuplicate = await page.evaluate(() => mergeLearnerState(
    {
      updatedAt: 20,
      activeDeck: 'en-b1', preferredLang: 'en', settings: { dailyGoal: 3 },
      picked: [{ id: 'picked-local', target: 'align', meaning: '本机语境', example: 'Please align today.', lang: 'en', level: 'B2' }],
      studyRecords: { 'picked:picked-local': { interval: 3, lastReviewed: '2026-10-10' } },
      dailyActivity: { '2026-10-10': { reviewed: ['picked:picked-local'], firstTryCorrect: 1, retried: 0 } },
      reviewHistory: [{ id: 'review-local', cardKey: 'picked:picked-local', reviewedAt: '2026-10-10T12:00:00.000Z' }],
    },
    {
      updatedAt: 10,
      activeDeck: 'en-b1', preferredLang: 'en', settings: { dailyGoal: 3 },
      picked: [{ id: 'picked-remote', target: 'align', meaning: '云端语境', example: 'We align weekly.', lang: 'en', level: 'B2' }],
      studyRecords: { 'picked:picked-remote': { interval: 7, lastReviewed: '2026-10-11' } },
      dailyActivity: { '2026-10-11': { reviewed: ['picked:picked-remote'], firstTryCorrect: 1, retried: 0 } },
      reviewHistory: [{ id: 'review-remote', cardKey: 'picked:picked-remote', reviewedAt: '2026-10-11T12:00:00.000Z' }],
    },
  ))
  check('数据同步', '跨设备重复卡合并并迁移复习引用', mergedDuplicate.picked.length === 1 && mergedDuplicate.picked[0].id === 'picked-local' && mergedDuplicate.studyRecords['picked:picked-local']?.interval === 7 && !mergedDuplicate.studyRecords['picked:picked-remote'] && Object.values(mergedDuplicate.dailyActivity).every(day => day.reviewed.every(key => key === 'picked:picked-local')) && mergedDuplicate.reviewHistory.every(item => item.cardKey === 'picked:picked-local'), JSON.stringify(mergedDuplicate))

  check('浏览器旅程', '首次进入先选语言', await page.locator('[data-onboard-lang="en"]').isVisible(), '新手引导第 1 步')
  check('浏览器旅程', '新用户连续天数从零开始', (await page.locator('#streakCount').innerText()) === '0', await page.locator('#streakCount').innerText())
  await page.locator('[data-onboard-lang="en"]').click()
  check('浏览器旅程', '语言选择后设置每日目标', await page.locator('[data-onboard-goal="3"]').isVisible() && await page.locator('[data-onboard-goal="12"]').isVisible(), '新手引导第 2 步')
  await page.locator('[data-onboard-goal="3"]').click()
  check('浏览器旅程', '设置目标后出现两条直达路径', await page.locator('#guideQuickPractice').isVisible() && await page.locator('#guideTryPickup').isVisible(), '新手引导第 3 步')
  await page.locator('#guideQuickPractice').click()

  for (const answer of ['explain', 'report', 'comment']) {
    await page.locator('#answer').fill(answer)
    await page.locator('#checkBtn').click()
    const feedback = await page.locator('#feedback h3').innerText()
    check('浏览器旅程', `可接受答案 ${answer}`, feedback.includes('也可以这样说'), feedback)
    await page.locator('#nextBtn').click()
  }
  check('浏览器旅程', '完成三题进入总结页', await page.locator('.session-complete').isVisible(), await page.locator('.session-complete').innerText())

  const state = await page.evaluate(() => JSON.parse(localStorage.getItem('pickup-mvp-state')))
  const today = Object.keys(state.dailyActivity)[0]
  check('浏览器旅程', '每日记录写入本地状态', state.dailyActivity[today].reviewed.length === 3, `${state.dailyActivity[today].reviewed.length} 条`)
  check('浏览器旅程', '三题均生成下次复习日期', Object.values(state.studyRecords).length === 3 && Object.values(state.studyRecords).every(item => item.due > today), JSON.stringify(state.studyRecords))

  await page.locator('#goPickupBtn').click()
  await page.locator('#analyseBtn').click()
  const cardPreview = await page.locator('#candidates .candidate').first().innerText()
  check('浏览器旅程', '本地拾取使用原文生成挖空卡', cardPreview.includes('Before the project starts') && cardPreview.includes('___'), cardPreview)
  await page.locator('#candidates [data-add-practice]').click()
  check('浏览器旅程', '本地拾取后立即进入个人练习卡', (await page.locator('#studyDeck').innerText()) === '我的练习卡', await page.locator('#studyDeck').innerText())
  const pickedState = await page.evaluate(() => JSON.parse(localStorage.getItem('pickup-mvp-state')))
  const alignCard = pickedState.picked.find(item => item.target === 'align')
  check('浏览器旅程', '拾取内容已持久化为完整练习卡', alignCard?.cardType === 'practice' && alignCard?.cardVersion === 2 && alignCard?.cloze.includes('___') && alignCard?.example.includes("let's align") && alignCard?.translation && alignCard?.explanation, JSON.stringify(alignCard))
  await page.locator('#answer').fill('align')
  await page.locator('#checkBtn').click()
  const pickedReviewedState = await page.evaluate(() => JSON.parse(localStorage.getItem('pickup-mvp-state')))
  const pickedRecord = pickedReviewedState.studyRecords[`picked:${alignCard.id}`]
  check('浏览器旅程', '拾取卡作答进入 FSRS-6 排期', pickedRecord?.algorithm === 'fsrs-6' && pickedRecord?.due && pickedRecord?.fsrsCard?.reps === 1, JSON.stringify(pickedRecord))
  const pickedCountBeforeDuplicate = pickedReviewedState.picked.length
  await page.locator('.side-nav [data-screen="import"]').click()
  await page.locator('#analyseBtn').click()
  await page.locator('#candidates [data-add-all]').click()
  const deduplicatedState = await page.evaluate(() => JSON.parse(localStorage.getItem('pickup-mvp-state')))
  check('浏览器旅程', '重复制卡更新语境但不增加重复卡', deduplicatedState.picked.length === pickedCountBeforeDuplicate && deduplicatedState.picked.find(item => item.target === 'align')?.id === alignCard.id && deduplicatedState.studyRecords[`picked:${alignCard.id}`]?.algorithm === 'fsrs-6', JSON.stringify(deduplicatedState.picked))
  check('浏览器旅程', '页面无运行时错误', pageErrors.length === 0, pageErrors.join(' | '))

  const retryPage = await browser.newPage({ viewport: { width: 1280, height: 900 } })
  await retryPage.route('**/api/track', route => route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' }))
  await retryPage.route('**/api/feedback', route => route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true,"id":"feedback-test"}' }))
  await retryPage.goto(`http://127.0.0.1:${port}`, { waitUntil: 'networkidle' })
  await retryPage.evaluate(() => localStorage.clear())
  await retryPage.reload({ waitUntil: 'networkidle' })
  await retryPage.locator('[data-onboard-lang="en"]').click()
  await retryPage.locator('[data-onboard-goal="3"]').click()
  await retryPage.locator('#guideQuickPractice').click()
  await retryPage.locator('#answer').fill('banana')
  await retryPage.locator('#checkBtn').click()
  const retryFeedback = await retryPage.locator('#feedback').innerText()
  check('浏览器旅程', '真正错误必须重输', !(await retryPage.locator('#nextBtn').count()) && (await retryPage.locator('#checkBtn').innerText()) === '提交答案', await retryPage.locator('#feedback h3').innerText())
  check('浏览器旅程', '错误反馈先给答案和动作', (await retryPage.locator('#feedback h3').innerText()) === '正确答案是 clarify' && retryFeedback.includes('输入 clarify，再提交一次'), retryFeedback)
  check('浏览器旅程', '学习页不暴露系统分层', !/语义相似分析|词书缓存|实时 AI|本地判断/.test(retryFeedback), retryFeedback)
  check('浏览器旅程', '更多解释默认收起', !(await retryPage.locator('.feedback-details').getAttribute('open')) && !(await retryPage.locator('#aiExplainBtn').isVisible()), '详细解释和 AI 入口未抢占主流程')
  await retryPage.locator('.reaction-details summary').click()
  await retryPage.locator('[data-reaction="like"]').click()
  await retryPage.locator('#reactionStatus').waitFor({ state: 'visible' })
  await retryPage.waitForFunction(() => document.querySelector('#reactionStatus')?.textContent === '已收到，谢谢')
  check('浏览器旅程', '点赞反馈成功上传', (await retryPage.locator('#reactionStatus').innerText()) === '已收到，谢谢', await retryPage.locator('#reactionStatus').innerText())
  await retryPage.locator('#answer').fill('clarify')
  await retryPage.locator('#checkBtn').click()
  const retryState = await retryPage.evaluate(() => JSON.parse(localStorage.getItem('pickup-mvp-state')))
  check('浏览器旅程', '重输通过记录为待巩固', Object.values(retryState.studyRecords)[0].lastResult === 'retried' && retryState.wrong.includes('en-clarify'), JSON.stringify(retryState.studyRecords))

  await retryPage.locator('.side-nav [data-screen="settings"]').click()
  check('设置页', '默认只显示三个核心区域', await retryPage.getByText('每天学多少', { exact: true }).isVisible() && await retryPage.getByText('账号同步', { exact: true }).isVisible() && await retryPage.getByText('我的学习质量', { exact: true }).isVisible(), '每日学习量、账号同步、我的学习质量')
  check('设置页', '高级功能默认收起', (await retryPage.locator('.settings-details[open], .tech-details[open]').count()) === 0, '更多设置、帮助和技术说明均默认收起')

  await retryPage.locator('.side-nav [data-screen="smart"]').click()
  check('内容路线', '智能精选有独立可达页面', await retryPage.locator('#smart').isVisible() && await retryPage.locator('#smartRecommendBtn').isVisible(), '左侧导航 → 智能精选')
  await retryPage.locator('.side-nav [data-screen="import"]').click()
  check('内容路线', '个人拾取不再暴露本地规则黑话', !(await retryPage.locator('#import').innerText()).includes('本地规则') && (await retryPage.locator('#analyseBtn').innerText()).includes('不上传'), await retryPage.locator('#analyseBtn').innerText())

  const legacyPage = await browser.newPage({ viewport: { width: 1280, height: 900 } })
  await legacyPage.route('**/api/track', route => route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' }))
  await legacyPage.goto(`http://127.0.0.1:${port}`, { waitUntil: 'networkidle' })
  await legacyPage.evaluate(() => {
    localStorage.clear()
    localStorage.setItem('lingograb-onboarding-v2', '1')
    localStorage.setItem('lingograb-daily-goal-chosen-v1', '1')
    localStorage.setItem('pickup-mvp-state', JSON.stringify({
      activeDeck: 'en-b1',
      preferredLang: 'en',
      picked: [{ id: 'picked-existing', target: 'touch base', meaning: '联系确认', example: '<img src=x onerror="window.__pickedXss=1"> I would like to touch base with the team before the meeting.', lang: 'en', level: 'B1', source: '旧拾取' }],
      studyRecords: { 'picked:picked-existing': { due: '2026-10-12', interval: 1, lastReviewed: '2026-10-11', lastResult: 'first_try' } },
      settings: { dailyGoal: 3, aiEnabled: true },
    }))
  })
  await legacyPage.reload({ waitUntil: 'networkidle' })
  const migratedState = await legacyPage.evaluate(() => JSON.parse(localStorage.getItem('pickup-mvp-state')))
  const migratedCard = migratedState.picked[0]
  check('安全边界', '拾取题面按纯文本渲染', await legacyPage.locator('#cloze img').count() === 0 && await legacyPage.evaluate(() => window.__pickedXss !== 1) && (await legacyPage.locator('#cloze').innerText()).includes('<img'), await legacyPage.locator('#cloze').innerText())
  check('数据迁移', '加载后立即持久化完整练习卡', migratedCard.id === 'picked-existing' && migratedCard.cardVersion === 2 && migratedCard.cloze.includes('___') && migratedCard.example.includes('touch base'), JSON.stringify(migratedCard))
  check('数据迁移', '旧拾取的复习记录不丢失', migratedState.studyRecords['picked:picked-existing']?.interval === 1, JSON.stringify(migratedState.studyRecords))
  await legacyPage.locator('.side-nav [data-screen="library"]').click()
  await legacyPage.locator('[data-scope="picked"]').click()
  check('数据迁移', '我的词书显示卡片和单卡练习入口', (await legacyPage.locator('#libraryCount').innerText()).includes('1 张练习卡') && await legacyPage.locator('[data-practice-picked="picked-existing"]').isVisible(), await legacyPage.locator('#termList').innerText())
  await legacyPage.locator('[data-practice-picked="picked-existing"]').click()
  await legacyPage.locator('#answer').fill('touch base')
  await legacyPage.locator('#checkBtn').click()
  const migratedReviewedState = await legacyPage.evaluate(() => JSON.parse(localStorage.getItem('pickup-mvp-state')))
  const migratedRecord = migratedReviewedState.studyRecords['picked:picked-existing']
  check('数据迁移', '旧排期首次复习后延续为 FSRS 状态', migratedRecord.algorithm === 'fsrs-6' && migratedRecord.fsrsCard?.reps === 2 && migratedRecord.interval > 1, JSON.stringify(migratedRecord))

  const frenchPage = await browser.newPage({ viewport: { width: 1280, height: 900 } })
  await frenchPage.route('**/api/track', route => route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' }))
  await frenchPage.goto(`http://127.0.0.1:${port}`, { waitUntil: 'networkidle' })
  await frenchPage.evaluate(() => localStorage.clear())
  await frenchPage.reload({ waitUntil: 'networkidle' })
  await frenchPage.locator('[data-onboard-lang="fr"]').click()
  await frenchPage.locator('[data-onboard-goal="3"]').click()
  await frenchPage.locator('#guideTryPickup').click()
  await frenchPage.locator('#analyseBtn').click()
  const frenchCandidates = await frenchPage.locator('#candidates .candidate').count()
  check('法语制卡', '法语材料可在浏览器本地生成练习卡', frenchCandidates >= 4 && (await frenchPage.locator('#candidates').innerText()).includes('___'), await frenchPage.locator('#candidates').innerText())
  await frenchPage.locator('#candidates [data-add-all]').click()
  const frenchState = await frenchPage.evaluate(() => JSON.parse(localStorage.getItem('pickup-mvp-state')))
  check('法语制卡', '法语拾取以完整卡片保存', frenchState.picked.length === frenchCandidates && frenchState.picked.every(item => item.lang === 'fr' && item.cardType === 'practice' && item.cloze.includes('___')), JSON.stringify(frenchState.picked))

  const adminPage = await browser.newPage({ viewport: { width: 1280, height: 900 } })
  await adminPage.addInitScript(() => localStorage.removeItem('lingograb_admin_key'))
  const analyticsFixture = {
    ok: true,
    range: { from: '2026-10-01', to: '2026-10-08' },
    dataHealth: { sampleStatus: 'small', strictFunnel: true },
    overview: { uv: 11, uvHumans: 10, uvPeople: 9, loggedInAccounts: 2, pv: 28, sessions: 12, newVisitorsHumans: 7, avgDwellSec: 93, avgDwellSecHumans: 101, avgPvPerVisitor: 2.5, avgPvPerVisitorHumans: 2.8, bounceRatePct: 40, bounceRatePctHumans: 30, errors: 1, errorRatePer100Sessions: 8.3 },
    funnelByMode: Object.fromEntries(['all', 'humans', 'people'].map(mode => [mode, [
      { label: '访问产品', count: mode === 'all' ? 11 : mode === 'humans' ? 10 : 9, rateFromVisit: 100 },
      { label: '浏览内容路线', count: 8, rateFromVisit: 80 },
      { label: '开始学习', count: 6, rateFromVisit: 60 },
      { label: '完成一轮', count: 4, rateFromVisit: 40 },
    ]])),
    views: [{ view: 'today', pv: 12, dwellSec: 720, avgDwellSec: 60 }],
    sources: [{ label: 'direct', count: 8 }, { label: 'google.com', count: 4 }],
    campaigns: [{ label: 'portfolio', count: 3 }],
    devices: [{ label: 'desktop', count: 8 }, { label: 'mobile', count: 4 }],
    geo: [{ label: 'CN', count: 12 }], errors: [{ label: 'ai_request', count: 1 }],
    performance: [{ metric: 'page_load', avgMs: 980, samples: 10 }],
    feedbackSummary: { likes: 2, dislikes: 1, writtenFeedback: 1, likeRate: 66.7, ratings: 3 },
    retention: { avgD1Pct: 20 },
    judgments: [{ level: 'info', title: '样本量较小', detail: '当前数据只能作为方向性线索。', evidence: '真人 UV 为 10。', confidence: '低', validationPlan: '累计至少 30 个真人 UV。' }],
    trend: [{ day: '2026-10-08', uvHumans: 10, pv: 28, sessions: 12, avgDwellSec: 101, studyStarts: 6, completes: 4, errors: 1 }],
    feedback: { items: [{ createdAt: '2026-10-08T08:00:00.000Z', content: '学习反馈：没帮助', meta: { rating: 'dislike', area: 'answer_feedback', cardId: 'en-clarify', answerResult: 'wrong' } }] },
  }
  await adminPage.route('**/api/lingograb-analytics', route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(analyticsFixture) }))
  await adminPage.goto(`http://127.0.0.1:${port}/admin.html`, { waitUntil: 'networkidle' })
  check('用户运营看板', '北京时间不会在凌晨少一天', await adminPage.evaluate(() => beijingDay(Date.UTC(2026, 9, 8, 17)) === '2026-10-09'), 'UTC 10月8日 17:00 应归属北京时间 10月9日')
  check('用户运营看板', '页面直接说明真实数据起点', (await adminPage.locator('.data-start').innerText()).includes('2026-10-08 16:59') && (await adminPage.locator('.data-start').innerText()).includes('无法回填历史 UV'), await adminPage.locator('.data-start').innerText())
  check('用户运营看板', '未填 Key 展示完整演示数据', (await adminPage.locator('#mode').innerText()) === '演示数据' && (await adminPage.locator('#overview').innerText()).includes('126') && (await adminPage.locator('#sources').innerText()).includes('直接访问') && (await adminPage.locator('#feedback').innerText()).includes('演示反馈'), await adminPage.locator('#notice').innerText())
  await adminPage.locator('#key').fill('test-key')
  await adminPage.locator('#load').click()
  await adminPage.waitForFunction(() => document.querySelector('#stamp')?.textContent.includes('小样本'))
  check('用户运营看板', '有效 Key 切换为真实数据', (await adminPage.locator('#mode').innerText()) === '真实数据' && (await adminPage.locator('#notice').innerText()).includes('真实用户'), await adminPage.locator('#notice').innerText())
  check('用户运营看板', 'UV、来源、停留和去重漏斗可读', (await adminPage.locator('#overview').innerText()).includes('10') && (await adminPage.locator('#sources').innerText()).includes('google.com') && (await adminPage.locator('#views').innerText()).includes('1 分') && (await adminPage.locator('#funnel').innerText()).includes('完成一轮'), await adminPage.locator('#funnel').innerText())
  check('用户运营看板', '错误率与性能数据可读', (await adminPage.locator('#overview').innerText()).includes('每百会话错误') && (await adminPage.locator('#reliability').innerText()).includes('980 ms'), await adminPage.locator('#reliability').innerText())
  check('用户运营看板', '小样本判断有证据和验证方案', (await adminPage.locator('#judgments').innerText()).includes('样本量较小') && (await adminPage.locator('#judgments').innerText()).includes('证据') && (await adminPage.locator('#judgments').innerText()).includes('验证'), await adminPage.locator('#judgments').innerText())
  check('用户运营看板', '点踩明细可定位到学习卡', (await adminPage.locator('#feedback').innerText()).includes('en-clarify') && (await adminPage.locator('#feedback').innerText()).includes('没帮助'), await adminPage.locator('#feedback').innerText())

  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 } })
  await mobile.route('**/api/track', route => route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' }))
  await mobile.goto(`http://127.0.0.1:${port}`, { waitUntil: 'networkidle' })
  await mobile.evaluate(() => localStorage.clear())
  await mobile.reload({ waitUntil: 'networkidle' })
  const width = await mobile.evaluate(() => ({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }))
  check('移动端', '无横向溢出', width.scroll <= width.client, `${width.scroll}/${width.client}`)
  check('移动端', '底部导航可见', await mobile.locator('.mobile-nav').isVisible(), '390 × 844')
} finally {
  if (browser) await browser.close()
  server.close()
}

const passed = checks.filter(item => item.pass).length
const failed = checks.filter(item => !item.pass)
const groups = [...new Set(checks.map(item => item.group))]
const report = {
  generatedAt: new Date().toISOString(),
  summary: { passed, total: checks.length, failed: failed.length },
  groups: Object.fromEntries(groups.map(group => {
    const rows = checks.filter(item => item.group === group)
    return [group, { passed: rows.filter(item => item.pass).length, total: rows.length }]
  })),
  checks,
  evaluationAudit: {
    strengths: [
      '同一套测试同时检查纯规则、静态实现和真实浏览器旅程，能发现只改文案但未打通状态的情况。',
      '多答案用例来自既有人工复核中已经确认的争议案例，目标是降低误判而不是提高表面分数。',
      '复习排期检查 FSRS-6 算法标记、评级映射与状态递增，避免只验证字段存在。',
    ],
    blindSpots: [
      '这套检查不能证明 D1 或 D7 留存，也不能证明长期记忆效果。',
      '实时 AI 的讲解质量、接口时延和模型降级仍由专项评测单独验证。',
      '英语和法语可接受答案仍需持续由语言专家扩充，自动用例不能替代专家审校。',
      '移动端仅覆盖代表性视口和横向溢出，不能替代真实设备与辅助技术测试。',
    ],
    decision: failed.length ? '存在阻断问题，不应上线。' : '核心闭环可上线验证，但不能将自动通过率表述为真实学习效果。',
  },
}

const reportDir = path.join(here, 'reports')
await fs.mkdir(reportDir, { recursive: true })
await fs.writeFile(path.join(reportDir, 'lingograb-product-optimization-evaluation.json'), JSON.stringify(report, null, 2) + '\n')

const markdown = [
  '# LingoGrab 产品优化评测报告',
  '',
  `生成时间：${report.generatedAt}`,
  '',
  '## 结论',
  '',
  `本轮共执行 ${report.summary.total} 项检查，通过 ${report.summary.passed} 项，失败 ${report.summary.failed} 项。`,
  '',
  ...groups.flatMap(group => {
    const rows = checks.filter(item => item.group === group)
    return [`## ${group}`, '', '| 检查项 | 结果 | 证据 |', '|---|:---:|---|', ...rows.map(item => `| ${item.name} | ${item.pass ? '通过' : '失败'} | ${String(item.evidence).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\|/g, '\\|').replace(/\n/g, ' ')} |`), '']
  }),
  '## 评测自评',
  '',
  '### 这套评测能说明什么',
  '',
  ...report.evaluationAudit.strengths.map(item => `- ${item}`),
  '',
  '### 这套评测不能说明什么',
  '',
  ...report.evaluationAudit.blindSpots.map(item => `- ${item}`),
  '',
  '### 上线判断',
  '',
  report.evaluationAudit.decision,
  '',
].join('\n')
await fs.writeFile(path.join(reportDir, 'lingograb-product-optimization-evaluation.md'), markdown)

console.log(JSON.stringify(report.summary))
if (failed.length) {
  console.error(failed)
  process.exit(1)
}
