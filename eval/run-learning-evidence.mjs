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
const check = (group, name, pass, evidence = '') => checks.push({ group, name, pass: Boolean(pass), evidence })

const sanitized = routing.sanitizeEventProperties({
  language: 'en',
  result: 'wrong',
  rawAnswer: 'company secret',
  importedText: 'private meeting notes',
  contact: 'person@example.com',
})
check('隐私与数据结构', '事件白名单过滤原始答案', !('rawAnswer' in sanitized), JSON.stringify(sanitized))
check('隐私与数据结构', '事件白名单过滤导入原文', !('importedText' in sanitized), JSON.stringify(sanitized))
check('隐私与数据结构', '事件白名单过滤联系方式', !('contact' in sanitized), JSON.stringify(sanitized))

const review = routing.createReviewEvent({
  cardKey: 'deck:en-b1:en-clarify',
  result: 'acceptable',
  firstTry: true,
  previousInterval: 1,
  scheduledInterval: 3,
  due: '2026-10-10',
  source: 'deck',
  sessionId: 'session-test',
}, new Date('2026-10-07T09:00:00Z'))
check('隐私与数据结构', '复习事件可回放', review.result === 'acceptable' && review.previousInterval === 1 && review.scheduledInterval === 3 && review.due === '2026-10-10', JSON.stringify(review))
check('隐私与数据结构', '复习事件不含输入文本字段', !('answer' in review) && !('rawAnswer' in review) && !('text' in review), Object.keys(review).join(', '))

const deduped = routing.appendCappedUnique(
  [{ id: 'a', timestamp: '2026-10-07T01:00:00Z' }, { id: 'b', timestamp: '2026-10-07T02:00:00Z' }],
  [{ id: 'b', timestamp: '2026-10-07T03:00:00Z' }, { id: 'c', timestamp: '2026-10-07T04:00:00Z' }],
  2,
)
check('同步与容量', '跨设备合并按事件 ID 去重', deduped.length === 2 && new Set(deduped.map(item => item.id)).size === 2, JSON.stringify(deduped))
check('同步与容量', '事件列表遵守容量上限', deduped.length === 2 && deduped.at(-1).id === 'c', JSON.stringify(deduped))

const summary = routing.summarizeReviewHistory([
  { result: 'wrong', firstTry: false },
  { result: 'retried', firstTry: false },
  { result: 'acceptable', firstTry: true },
  { result: 'target', firstTry: true },
])
check('学习指标', '完成数不把错误尝试算作完成', summary.completed === 3, JSON.stringify(summary))
check('学习指标', '首次答对率按完成表达计算', summary.firstTryRate === 67, JSON.stringify(summary))
check('学习指标', '重输与可接受答案分开统计', summary.retried === 1 && summary.acceptable === 1 && summary.wrongAttempts === 1, JSON.stringify(summary))

const html = await fs.readFile(path.join(root, 'index.html'), 'utf8')
check('静态实现', '本地状态包含逐次复习历史', html.includes('reviewHistory:[]') && html.includes('createReviewEvent'), 'reviewHistory + createReviewEvent')
check('静态实现', '云端合并保留两端事件', html.includes('appendCappedUnique(remote.reviewHistory,local.reviewHistory,5000)'), '按 ID 合并，最多 5000 条')
check('静态实现', '研究导出声明隐私边界', html.includes('containsRawAnswers:false') && html.includes('containsImportedMaterial:false') && html.includes('containsContact:false'), '三个敏感字段均声明不包含')
check('静态实现', '设置页展示用户自己的指标', ['evidenceCompleted', 'evidenceFirstTry', 'evidenceRetries', 'evidenceAttempts'].every(id => html.includes(`id="${id}"`)), '四项学习指标')

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
    response.writeHead(200, { 'Content-Type': contentType(file) })
    response.end(await fs.readFile(file))
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
  await page.locator('[data-onboard-lang="en"]').click()
  await page.locator('#guideQuickPractice').click()

  for (const answer of ['explain', 'report', 'comment']) {
    await page.locator('#answer').fill(answer)
    await page.locator('#checkBtn').click()
    await page.locator('#nextBtn').click()
  }

  const completedState = await page.evaluate(() => JSON.parse(localStorage.getItem('pickup-mvp-state')))
  check('浏览器证据链', '三次完成均写入逐次历史', completedState.reviewHistory.length === 3, `${completedState.reviewHistory.length} 条`)
  check('浏览器证据链', '可接受答案保留分类但不保留答案文本', completedState.reviewHistory.every(item => item.result === 'acceptable') && !JSON.stringify(completedState.reviewHistory).includes('explain'), JSON.stringify(completedState.reviewHistory))
  check('浏览器证据链', '新手路径与完成事件写入日志', completedState.eventLog.some(item => item.name === 'onboarding_complete') && completedState.eventLog.some(item => item.name === 'session_complete'), completedState.eventLog.map(item => item.name).join(', '))

  await page.locator('[data-screen="settings"]').first().click()
  check('浏览器证据链', '设置页展示完成数', (await page.locator('#evidenceCompleted').innerText()) === '3', await page.locator('#evidenceCompleted').innerText())
  check('浏览器证据链', '设置页展示首次答对率', (await page.locator('#evidenceFirstTry').innerText()) === '100%', await page.locator('#evidenceFirstTry').innerText())
  const research = await page.evaluate(() => buildResearchExport())
  const researchJson = JSON.stringify(research)
  check('浏览器证据链', '研究包给出机器可读隐私声明', research.privacy.containsRawAnswers === false && research.privacy.containsImportedMaterial === false && research.privacy.containsContact === false, JSON.stringify(research.privacy))
  check('浏览器证据链', '研究包不含原始作答内容', !researchJson.includes('explain') && !researchJson.includes('report') && !researchJson.includes('comment'), '未发现三个测试答案')
  check('浏览器证据链', '页面无运行时错误', pageErrors.length === 0, pageErrors.join(' | '))

  const retryPage = await browser.newPage({ viewport: { width: 390, height: 844 } })
  await retryPage.goto(`http://127.0.0.1:${port}`, { waitUntil: 'networkidle' })
  await retryPage.evaluate(() => localStorage.clear())
  await retryPage.reload({ waitUntil: 'networkidle' })
  await retryPage.locator('[data-onboard-lang="en"]').click()
  await retryPage.locator('#guideQuickPractice').click()
  await retryPage.locator('#answer').fill('banana')
  await retryPage.locator('#checkBtn').click()
  await retryPage.locator('#answer').fill('clarify')
  await retryPage.locator('#checkBtn').click()
  const retryState = await retryPage.evaluate(() => JSON.parse(localStorage.getItem('pickup-mvp-state')))
  check('浏览器证据链', '一次错误与重输形成两条历史', retryState.reviewHistory.length === 2 && retryState.reviewHistory[0].result === 'wrong' && retryState.reviewHistory[1].result === 'retried', JSON.stringify(retryState.reviewHistory))
  check('浏览器证据链', '历史记录未泄露错误答案', !JSON.stringify(retryState.reviewHistory).includes('banana'), '未发现 banana')
  const width = await retryPage.evaluate(() => ({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }))
  check('移动端', '新增学习记录无横向溢出', width.scroll <= width.client, `${width.scroll}/${width.client}`)
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
      '规则级检查、浏览器旅程和导出对象检查覆盖了从用户作答到研究数据包的完整证据链。',
      '测试明确注入原始答案、导入文本和联系方式，验证白名单会排除这些字段。',
      '错误后重输的两次尝试分别留存，为未来离线回放和 FSRS 参数实验保留信息。',
    ],
    blindSpots: [
      '本地事件可被用户修改，不能作为审计级或反作弊数据。',
      '这套评测证明数据结构可用，不证明 D1/D7 留存、长期记忆提升或因果效果。',
      '当前没有服务端 cohort 看板；研究数据包仍需要用户自愿导出和分享。',
      '时间戳依赖设备时钟，跨时区与错误系统时间需要在真实研究中单独处理。',
    ],
    decision: failed.length ? '证据链存在阻断问题，不应上线。' : '证据底座可以上线收集自愿研究样本，但不得把自动评测表述为真实留存或学习效果。',
  },
}

const reportDir = path.join(here, 'reports')
await fs.mkdir(reportDir, { recursive: true })
await fs.writeFile(path.join(reportDir, 'lingograb-learning-evidence-evaluation.json'), JSON.stringify(report, null, 2) + '\n')
const markdown = [
  '# LingoGrab 学习证据底座评测报告',
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
await fs.writeFile(path.join(reportDir, 'lingograb-learning-evidence-evaluation.md'), markdown)

console.log(JSON.stringify(report.summary))
if (failed.length) {
  console.error(failed)
  process.exit(1)
}
