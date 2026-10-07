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

const fixedToday = new Date('2026-10-07T12:00:00')
const schedule = routing.upcomingReviewSchedule({
  overdue: { due: '2026-10-05' },
  today: { due: '2026-10-07' },
  tomorrow: { due: '2026-10-08' },
  later: { due: '2026-10-10' },
  outside: { due: '2026-10-15' },
  invalid: { due: 'not-a-date' },
}, fixedToday, 7)
check('排期规则', '固定生成连续 7 天', schedule.length === 7 && schedule[0].date === '2026-10-07' && schedule[6].date === '2026-10-13', JSON.stringify(schedule))
check('排期规则', '逾期内容合并到今天', schedule[0].count === 2, JSON.stringify(schedule[0]))
check('排期规则', '明日与未来日期分别计数', schedule[1].count === 1 && schedule[3].count === 1, JSON.stringify(schedule))
check('排期规则', '窗口外和无效日期不进入日历', schedule.reduce((sum, item) => sum + item.count, 0) === 4, JSON.stringify(schedule))

const summary = routing.summarizeReviewHistory([
  { cardKey: 'a', result: 'target', firstTry: true, previousInterval: 0 },
  { cardKey: 'a', result: 'target', firstTry: true, previousInterval: 1 },
  { cardKey: 'b', result: 'wrong', firstTry: false, previousInterval: 3 },
  { cardKey: 'b', result: 'retried', firstTry: false, previousInterval: 3 },
  { cardKey: 'c', result: 'acceptable', firstTry: true, previousInterval: 7 },
])
check('延迟回忆指标', '首次学习不进入延迟回忆分母', summary.delayedReviews === 3, JSON.stringify(summary))
check('延迟回忆指标', '错误尝试不重复扩大完成分母', summary.completed === 4 && summary.wrongAttempts === 1, JSON.stringify(summary))
check('延迟回忆指标', '延迟首次正确率按完成事件计算', summary.delayedFirstTry === 2 && summary.delayedRecallRate === 67, JSON.stringify(summary))
check('延迟回忆指标', '识别至少完成两次的卡片', summary.repeatCards === 1, JSON.stringify(summary))
const emptySummary = routing.summarizeReviewHistory([{ result: 'target', firstTry: true, previousInterval: 0 }])
check('延迟回忆指标', '无隔日样本时返回空值而非 0%', emptySummary.delayedRecallRate === null, JSON.stringify(emptySummary))

const html = await fs.readFile(path.join(root, 'index.html'), 'utf8')
check('静态实现', '今天页包含 7 天复习日历', html.includes('id="reviewForecast"') && html.includes('未来 7 天复习'), 'reviewForecast')
check('静态实现', '学习记录包含延迟回忆指标', html.includes('id="evidenceDelayedRecall"') && html.includes('样本不足时显示“—”'), 'evidenceDelayedRecall')
check('静态实现', '完成页区分到期复习', html.includes('<span>到期复习</span>') && html.includes('scheduledReviews'), '到期复习 + scheduledReviews')

function contentType(file) {
  if (file.endsWith('.html')) return 'text/html; charset=utf-8'
  if (file.endsWith('.js')) return 'text/javascript; charset=utf-8'
  if (file.endsWith('.txt')) return 'text/plain; charset=utf-8'
  if (file.endsWith('.svg')) return 'image/svg+xml'
  return 'application/octet-stream'
}

function localDateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function offsetDateKey(offset) {
  const date = new Date()
  date.setHours(12, 0, 0, 0)
  date.setDate(date.getDate() + offset)
  return localDateKey(date)
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
  const seeded = {
    activeDeck: 'en-b1',
    preferredLang: 'en',
    index: { 'fr-daily-a1': 0, 'fr-travel-a2': 0, 'fr-work-a2': 0, 'en-b1': 0, 'en-b2': 0 },
    mastered: ['en-clarify', 'en-update', 'en-feedback', 'en-follow-up', 'en-review'],
    wrong: [],
    picked: [],
    studyRecords: {
      'deck:en-b1:en-clarify': { interval: 1, due: offsetDateKey(0), lastReviewed: offsetDateKey(-1) },
      'deck:en-b1:en-update': { interval: 3, due: offsetDateKey(1), lastReviewed: offsetDateKey(-2) },
      'deck:en-b1:en-feedback': { interval: 7, due: offsetDateKey(3), lastReviewed: offsetDateKey(-4) },
      'deck:en-b1:en-follow-up': { interval: 14, due: offsetDateKey(8), lastReviewed: offsetDateKey(-6) },
      'deck:en-b1:en-review': { interval: 3, due: offsetDateKey(-1), lastReviewed: offsetDateKey(-4) },
    },
    reviewHistory: [
      { id: 'r1', cardKey: 'deck:en-b1:en-clarify', reviewedAt: new Date().toISOString(), result: 'target', firstTry: true, previousInterval: 1, scheduledInterval: 3, due: offsetDateKey(3), source: 'deck', sessionId: 'old', schemaVersion: 1 },
      { id: 'r2', cardKey: 'deck:en-b1:en-update', reviewedAt: new Date().toISOString(), result: 'wrong', firstTry: false, previousInterval: 3, scheduledInterval: 0, due: '', source: 'deck', sessionId: 'old', schemaVersion: 1 },
      { id: 'r3', cardKey: 'deck:en-b1:en-update', reviewedAt: new Date().toISOString(), result: 'retried', firstTry: false, previousInterval: 3, scheduledInterval: 1, due: offsetDateKey(1), source: 'deck', sessionId: 'old', schemaVersion: 1 },
      { id: 'r4', cardKey: 'deck:en-b1:en-feedback', reviewedAt: new Date().toISOString(), result: 'acceptable', firstTry: true, previousInterval: 7, scheduledInterval: 14, due: offsetDateKey(3), source: 'deck', sessionId: 'old', schemaVersion: 1 },
    ],
    eventLog: [],
    dailyActivity: {},
    activityDates: [],
    settings: { dailyGoal: 3, aiEnabled: false },
    updatedAt: Date.now(),
  }
  await page.evaluate(value => {
    localStorage.clear()
    localStorage.setItem('pickup-language-onboarding-v1', '1')
    localStorage.setItem('pickup-mvp-state', JSON.stringify(value))
  }, seeded)
  await page.reload({ waitUntil: 'networkidle' })

  const counts = await page.locator('#reviewForecast .forecast-day b').allInnerTexts()
  check('浏览器旅程', '今天页渲染恰好 7 个日期格', counts.length === 7, counts.join(','))
  check('浏览器旅程', '页面合并逾期并排除第 8 天', counts[0] === '2' && counts[1] === '1' && counts[3] === '1' && counts.reduce((sum, item) => sum + Number(item), 0) === 4, counts.join(','))
  check('浏览器旅程', '摘要解释当前已排期数量', (await page.locator('#forecastSummary').innerText()).includes('4 个表达'), await page.locator('#forecastSummary').innerText())

  await page.locator('[data-screen="settings"]').first().click()
  check('浏览器旅程', '设置页显示真实延迟回忆率', (await page.locator('#evidenceDelayedRecall').innerText()) === '67%', await page.locator('#evidenceDelayedRecall').innerText())

  await page.locator('[data-screen="today"]').first().click()
  await page.locator('#startTodayBtn').click()
  await page.locator('#answer').fill('clarify')
  await page.locator('#checkBtn').click()
  await page.locator('#nextBtn').click()
  await page.locator('#answer').fill('review')
  await page.locator('#checkBtn').click()
  await page.locator('#nextBtn').click()
  const sessionValues = await page.locator('.session-summary b').allInnerTexts()
  check('浏览器旅程', '完成页区分两次到期复习', sessionValues[0] === '2' && sessionValues[2] === '2', sessionValues.join(','))
  check('浏览器旅程', '到期复习首次正确显示 100%', sessionValues[3] === '100%', sessionValues.join(','))
  const completedState = await page.evaluate(() => JSON.parse(localStorage.getItem('pickup-mvp-state')))
  const completeEvent = completedState.eventLog.find(item => item.name === 'session_complete')
  check('浏览器旅程', '完成事件保留到期复习口径', completeEvent?.properties?.scheduledReviews === 2 && completeEvent?.properties?.delayedRecallRate === 100, JSON.stringify(completeEvent))
  check('浏览器旅程', '页面无运行时错误', pageErrors.length === 0, pageErrors.join(' | '))

  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 } })
  await mobile.goto(`http://127.0.0.1:${port}`, { waitUntil: 'networkidle' })
  await mobile.evaluate(value => {
    localStorage.setItem('pickup-language-onboarding-v1', '1')
    localStorage.setItem('pickup-mvp-state', JSON.stringify(value))
  }, seeded)
  await mobile.reload({ waitUntil: 'networkidle' })
  const width = await mobile.evaluate(() => ({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }))
  check('移动端', '7 天日历无横向溢出', width.scroll <= width.client, `${width.scroll}/${width.client}`)
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
      '纯规则测试固定系统日期，覆盖逾期合并、窗口边界、无效日期和延迟回忆分母。',
      '浏览器测试注入真实学习状态，验证日历、设置指标、完成页和事件记录口径一致。',
      '专门验证无隔日样本时显示空值，避免把没有证据误写成 0% 记忆率。',
    ],
    blindSpots: [
      '7 天日历是当前排期的确定性展示，不是对记忆概率的预测。',
      '延迟回忆率来自本机小样本，不能证明长期学习效果或产品因果增益。',
      '日期计算依赖设备时钟和本地时区；跨时区真实设备仍需补测。',
      '本轮没有将现有间隔规则与 FSRS 做离线对照，因此不支持宣称算法已最优。',
    ],
    decision: failed.length ? '复习解释层存在阻断问题，不应上线。' : '复习解释层可以上线；对外只能表述为真实排期与作答证据，不得表述为记忆预测或学习效果证明。',
  },
}

const reportDir = path.join(here, 'reports')
await fs.mkdir(reportDir, { recursive: true })
await fs.writeFile(path.join(reportDir, 'lingograb-review-insights-evaluation.json'), JSON.stringify(report, null, 2) + '\n')
const markdown = [
  '# LingoGrab 复习解释层评测报告',
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
await fs.writeFile(path.join(reportDir, 'lingograb-review-insights-evaluation.md'), markdown)

console.log(JSON.stringify(report.summary))
if (failed.length) {
  console.error(failed)
  process.exit(1)
}
