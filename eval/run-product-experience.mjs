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
const scheduleCases = [
  ['首次答对', { previousInterval: 0, correct: true, firstTry: true }, 1, '2026-10-08'],
  ['第二次首次答对', { previousInterval: 1, correct: true, firstTry: true }, 3, '2026-10-10'],
  ['连续掌握', { previousInterval: 3, correct: true, firstTry: true }, 7, '2026-10-14'],
  ['重输通过', { previousInterval: 7, correct: true, firstTry: false }, 1, '2026-10-08'],
  ['答错重排', { previousInterval: 14, correct: false, firstTry: false }, 1, '2026-10-08'],
]
for (const [name, input, interval, due] of scheduleCases) {
  const result = routing.nextReview({ ...input, today: base })
  check('复习排期', name, result.interval === interval && result.due === due, `${result.interval} 天 · ${result.due}`)
}

const html = await fs.readFile(path.join(root, 'index.html'), 'utf8')
const staticChecks = [
  ['真实连续天数', html.includes('id="streakCount"') && html.includes('function streak()')],
  ['每日完成页', html.includes('session-complete') && html.includes('这轮练习完成了')],
  ['拾取后一键练习', html.includes('pickAllPracticeBtn') && html.includes('startPickedPractice')],
  ['个人表达进入学习队列', html.includes("type:'picked'") && html.includes('pickedToCard')],
  ['学习记录与到期日', html.includes('studyRecords') && html.includes('lastReviewed')],
  ['学习数据导出', html.includes('id="exportBtn"') && html.includes('lingograb-learning-data.json')],
  ['词书数量口径', html.includes('可练习卡') && !html.includes('${d.size.toLocaleString(\'en-US\')} WORDS')],
  ['首次体验缩短', html.includes('直接练 3 道题') && html.includes('从示例材料拾取')],
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
  const pageErrors = []
  page.on('pageerror', error => pageErrors.push(String(error)))
  await page.goto(`http://127.0.0.1:${port}`, { waitUntil: 'networkidle' })
  await page.evaluate(() => localStorage.clear())
  await page.reload({ waitUntil: 'networkidle' })

  check('浏览器旅程', '首次进入先选语言', await page.locator('[data-onboard-lang="en"]').isVisible(), '新手引导第 1 步')
  check('浏览器旅程', '新用户连续天数从零开始', (await page.locator('#streakCount').innerText()) === '0', await page.locator('#streakCount').innerText())
  await page.locator('[data-onboard-lang="en"]').click()
  check('浏览器旅程', '语言选择后出现两条直达路径', await page.locator('#guideQuickPractice').isVisible() && await page.locator('#guideTryPickup').isVisible(), '新手引导第 2 步')
  await page.locator('#guideQuickPractice').click()

  for (const answer of ['explain', 'report', 'comment']) {
    await page.locator('#answer').fill(answer)
    await page.locator('#checkBtn').click()
    const feedback = await page.locator('#feedback h3').innerText()
    check('浏览器旅程', `可接受答案 ${answer}`, feedback.includes('这个答案也成立'), feedback)
    await page.locator('#nextBtn').click()
  }
  check('浏览器旅程', '完成三题进入总结页', await page.locator('.session-complete').isVisible(), await page.locator('.session-complete').innerText())

  const state = await page.evaluate(() => JSON.parse(localStorage.getItem('pickup-mvp-state')))
  const today = Object.keys(state.dailyActivity)[0]
  check('浏览器旅程', '每日记录写入本地状态', state.dailyActivity[today].reviewed.length === 3, `${state.dailyActivity[today].reviewed.length} 条`)
  check('浏览器旅程', '三题均生成下次复习日期', Object.values(state.studyRecords).length === 3 && Object.values(state.studyRecords).every(item => item.due > today), JSON.stringify(state.studyRecords))

  await page.locator('#goPickupBtn').click()
  await page.locator('#analyseBtn').click()
  await page.locator('#pickAllPracticeBtn').click()
  check('浏览器旅程', '本地拾取后立即进入个人表达练习', (await page.locator('#studyDeck').innerText()) === '我的真实表达', await page.locator('#studyDeck').innerText())
  check('浏览器旅程', '页面无运行时错误', pageErrors.length === 0, pageErrors.join(' | '))

  const retryPage = await browser.newPage({ viewport: { width: 1280, height: 900 } })
  await retryPage.goto(`http://127.0.0.1:${port}`, { waitUntil: 'networkidle' })
  await retryPage.evaluate(() => localStorage.clear())
  await retryPage.reload({ waitUntil: 'networkidle' })
  await retryPage.locator('[data-onboard-lang="en"]').click()
  await retryPage.locator('#guideQuickPractice').click()
  await retryPage.locator('#answer').fill('banana')
  await retryPage.locator('#checkBtn').click()
  check('浏览器旅程', '真正错误必须重输', !(await retryPage.locator('#nextBtn').count()) && (await retryPage.locator('#checkBtn').innerText()) === '重新检查', await retryPage.locator('#feedback h3').innerText())
  await retryPage.locator('#answer').fill('clarify')
  await retryPage.locator('#checkBtn').click()
  const retryState = await retryPage.evaluate(() => JSON.parse(localStorage.getItem('pickup-mvp-state')))
  check('浏览器旅程', '重输通过记录为待巩固', Object.values(retryState.studyRecords)[0].lastResult === 'retried' && retryState.wrong.includes('en-clarify'), JSON.stringify(retryState.studyRecords))

  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 } })
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
      '复习排期检查具体日期，避免只验证字段存在。',
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
    return [`## ${group}`, '', '| 检查项 | 结果 | 证据 |', '|---|:---:|---|', ...rows.map(item => `| ${item.name} | ${item.pass ? '通过' : '失败'} | ${String(item.evidence).replace(/\|/g, '\\|').replace(/\n/g, ' ')} |`), '']
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
