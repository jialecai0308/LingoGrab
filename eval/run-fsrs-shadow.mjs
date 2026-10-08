import fs from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { Rating, createEmptyCard, default_w, forgetting_curve, fsrs } from 'ts-fsrs'

const here = path.dirname(fileURLToPath(import.meta.url))
const reportDir = path.join(here, 'reports')
const inputPath = process.argv[2] ? path.resolve(process.cwd(), process.argv[2]) : ''

function at(day, hour = 9) {
  return new Date(`${day}T${String(hour).padStart(2, '0')}:00:00+08:00`).toISOString()
}

function fixtureHistory() {
  const rows = []
  const push = (cardKey, day, result, previousInterval, scheduledInterval, session, hour = 9) => rows.push({
    id: `${cardKey}-${day}-${result}-${rows.length}`,
    cardKey,
    reviewedAt: at(day, hour),
    result,
    firstTry: ['target', 'acceptable'].includes(result),
    previousInterval,
    scheduledInterval,
    due: '',
    source: 'deck',
    sessionId: session,
    schemaVersion: 1,
  })

  push('fixture:steady', '2026-09-01', 'target', 0, 1, 'a1')
  push('fixture:steady', '2026-09-02', 'target', 1, 3, 'a2')
  push('fixture:steady', '2026-09-05', 'target', 3, 7, 'a3')
  push('fixture:steady', '2026-09-12', 'target', 7, 14, 'a4')
  push('fixture:lapse', '2026-09-01', 'wrong', 0, 0, 'b1')
  push('fixture:lapse', '2026-09-01', 'retried', 0, 1, 'b1', 10)
  push('fixture:lapse', '2026-09-02', 'target', 1, 3, 'b2')
  push('fixture:lapse', '2026-09-05', 'wrong', 3, 0, 'b3')
  push('fixture:lapse', '2026-09-05', 'retried', 3, 1, 'b3', 10)
  push('fixture:lapse', '2026-09-06', 'target', 1, 3, 'b4')
  push('fixture:overdue', '2026-09-01', 'acceptable', 0, 1, 'c1')
  push('fixture:overdue', '2026-09-03', 'target', 1, 3, 'c2')
  push('fixture:overdue', '2026-09-09', 'wrong', 3, 0, 'c3')
  push('fixture:overdue', '2026-09-09', 'retried', 3, 1, 'c3', 10)
  return rows
}

function validHistory(value) {
  return (Array.isArray(value) ? value : []).filter(item => item && item.cardKey && !Number.isNaN(new Date(item.reviewedAt).getTime()))
}

function ratingFor(result) {
  if (result === 'wrong' || result === 'empty') return Rating.Again
  if (result === 'retried') return Rating.Hard
  return Rating.Good
}

function daysBetween(a, b) {
  return Math.max(0, (new Date(b).getTime() - new Date(a).getTime()) / 86400000)
}

function average(values) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null
}

function median(values) {
  if (!values.length) return null
  const sorted = [...values].sort((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2
}

function rounded(value, digits = 3) {
  return value == null ? null : Number(value.toFixed(digits))
}

function brier(samples, key) {
  return average(samples.map(item => (item[key] - item.actual) ** 2))
}

function logLoss(samples, key) {
  return average(samples.map(item => {
    const p = Math.min(0.999999, Math.max(0.000001, item[key]))
    return -(item.actual * Math.log(p) + (1 - item.actual) * Math.log(1 - p))
  }))
}

async function loadHistory() {
  if (!inputPath) return { source: 'built-in-contract-fixture', history: fixtureHistory() }
  const parsed = JSON.parse(await fs.readFile(inputPath, 'utf8'))
  return { source: inputPath, history: validHistory(parsed.reviewHistory || parsed) }
}

const loaded = await loadHistory()
const history = validHistory(loaded.history).sort((a, b) => String(a.reviewedAt).localeCompare(String(b.reviewedAt)))
if (!history.length) throw new Error('没有可回放的 reviewHistory。请传入 LingoGrab 导出的研究数据 JSON。')

const scheduler = fsrs({ request_retention: 0.9, enable_fuzz: false, enable_short_term: false })
const cards = new Map()
const predictions = []
const intervalPairs = []

for (const event of history) {
  const reviewedAt = new Date(event.reviewedAt)
  let card = cards.get(event.cardKey)
  if (!card) card = createEmptyCard(reviewedAt)

  const elapsed = card.last_review ? daysBetween(card.last_review, reviewedAt) : 0
  const isFirstAttempt = event.result !== 'retried'
  const hasDelayedEvidence = card.reps > 0 && elapsed >= 1 && Number(event.previousInterval) > 0 && isFirstAttempt
  if (hasDelayedEvidence) {
    const actual = ['target', 'acceptable'].includes(event.result) ? 1 : 0
    const fsrsProbability = forgetting_curve(default_w, elapsed, card.stability)
    const fixedProbability = Math.pow(0.9, elapsed / Math.max(1, Number(event.previousInterval) || 1))
    predictions.push({
      cardKey: event.cardKey,
      reviewedAt: event.reviewedAt,
      actual,
      elapsedDays: rounded(elapsed, 2),
      previousInterval: Number(event.previousInterval) || 0,
      fsrsProbability: rounded(fsrsProbability, 4),
      fixedProbability: rounded(fixedProbability, 4),
    })
  }

  const scheduled = scheduler.next(card, reviewedAt, ratingFor(event.result))
  card = scheduled.card
  cards.set(event.cardKey, card)
  if (Number(event.scheduledInterval) > 0 && ['target', 'acceptable', 'retried'].includes(event.result)) {
    intervalPairs.push({
      cardKey: event.cardKey,
      reviewedAt: event.reviewedAt,
      result: event.result,
      fixedDays: Number(event.scheduledInterval),
      fsrsDays: Number(card.scheduled_days),
      differenceDays: Number(card.scheduled_days) - Number(event.scheduledInterval),
    })
  }
}

const timestamps = history.map(item => new Date(item.reviewedAt).getTime())
const spanDays = Math.max(0, (Math.max(...timestamps) - Math.min(...timestamps)) / 86400000)
const crossDayCards = [...new Set(predictions.map(item => item.cardKey))].length
const decisionThreshold = { delayedOutcomeSamples: 200, cards: 50, spanDays: 28 }
const eligibleForDecision = predictions.length >= decisionThreshold.delayedOutcomeSamples && crossDayCards >= decisionThreshold.cards && spanDays >= decisionThreshold.spanDays
const fixedDays = intervalPairs.map(item => item.fixedDays)
const fsrsDays = intervalPairs.map(item => item.fsrsDays)
const result = {
  generatedAt: new Date().toISOString(),
  source: loaded.source,
  library: { name: 'ts-fsrs', version: '5.4.2', algorithm: 'FSRS-6', desiredRetention: 0.9, fuzzing: false, shortTermSteps: false },
  mapping: {
    wrongOrEmpty: 'Again',
    retriedAfterCorrection: 'Hard',
    targetOrAcceptedFirstTry: 'Good',
    easy: '当前产品没有“太简单”信号，不伪造 Easy 评级。',
  },
  dataReadiness: {
    events: history.length,
    cards: new Set(history.map(item => item.cardKey)).size,
    delayedOutcomeSamples: predictions.length,
    crossDayCards,
    spanDays: rounded(spanDays, 1),
    decisionThreshold,
    eligibleForDecision,
  },
  intervalShadow: {
    samples: intervalPairs.length,
    fixedMedianDays: rounded(median(fixedDays), 1),
    fsrsMedianDays: rounded(median(fsrsDays), 1),
    fixedAverageDays: rounded(average(fixedDays), 2),
    fsrsAverageDays: rounded(average(fsrsDays), 2),
    meanDifferenceDays: rounded(average(intervalPairs.map(item => item.differenceDays)), 2),
    pairs: intervalPairs,
  },
  predictiveShadow: {
    samples: predictions.length,
    fixedProxyBrier: rounded(brier(predictions, 'fixedProbability'), 4),
    fsrsBrier: rounded(brier(predictions, 'fsrsProbability'), 4),
    fixedProxyLogLoss: rounded(logLoss(predictions, 'fixedProbability'), 4),
    fsrsLogLoss: rounded(logLoss(predictions, 'fsrsProbability'), 4),
    samplesDetail: predictions,
  },
  secondJudge: {
    verdict: eligibleForDecision
      ? '数据量达到预设门槛，可进入用户级时间切分与统计复核；本报告仍不直接建议全量切换。'
      : '当前只足够验证回放链路和观察排期差异，不足以判定 FSRS 优于固定间隔。',
    evidence: [
      `${history.length} 条复习事件，${predictions.length} 个可比的跨日首次作答样本，覆盖 ${crossDayCards} 张卡。`,
      `数据时间跨度 ${rounded(spanDays, 1)} 天；决策门槛预设为 ${decisionThreshold.delayedOutcomeSamples} 个跨日样本、${decisionThreshold.cards} 张卡、${decisionThreshold.spanDays} 天。`,
      `FSRS 中位建议间隔 ${rounded(median(fsrsDays), 1) ?? '—'} 天，当前固定规则 ${rounded(median(fixedDays), 1) ?? '—'} 天；这只说明排期不同。`,
    ],
    confidence: eligibleForDecision ? '中' : '低',
    validationPlan: [
      '用真实自愿导出的 reviewHistory 连续做影子排期，线上仍使用现有规则。',
      '达到数据门槛后按用户和时间切分训练/验证，避免同一张卡泄漏到两侧。',
      '主指标比较 Brier score 与 log loss，辅指标比较每日复习量、隔天首次答对率和过期率。',
      '通过离线门槛后先小流量 A/B，设回滚开关；不以模型单次判语替代统计结论。',
    ],
    limitations: [
      loaded.source === 'built-in-contract-fixture' ? '本次默认输入是合约测试数据，不是真实用户样本。' : '输入来自导出文件，仍可能存在自选偏差和设备时钟偏差。',
      '当前产品不采集 Again/Hard/Good/Easy 四档自评，映射规则需要后续人工审核。',
      '固定规则没有记忆概率模型；报告中的 fixed probability 只是为对照构造的 90% 间隔代理曲线。',
    ],
  },
}

await fs.mkdir(reportDir, { recursive: true })
await fs.writeFile(path.join(reportDir, 'lingograb-fsrs-shadow-evaluation.json'), `${JSON.stringify(result, null, 2)}\n`)

const fmt = value => value == null ? '—' : String(value)
const markdown = [
  '# LingoGrab FSRS 影子评测',
  '',
  `生成时间：${result.generatedAt}`,
  '',
  '## 结论',
  '',
  result.secondJudge.verdict,
  '',
  `置信度：**${result.secondJudge.confidence}**。这是高级模型的小样本“第二判官”意见，不是统计结论。`,
  '',
  '## 数据准备度',
  '',
  '| 项目 | 当前 | 决策门槛 |',
  '|---|---:|---:|',
  `| 跨日首次作答样本 | ${result.dataReadiness.delayedOutcomeSamples} | ${decisionThreshold.delayedOutcomeSamples} |`,
  `| 覆盖卡片 | ${result.dataReadiness.crossDayCards} | ${decisionThreshold.cards} |`,
  `| 时间跨度（天） | ${result.dataReadiness.spanDays} | ${decisionThreshold.spanDays} |`,
  '',
  `是否可用于切换决策：**${result.dataReadiness.eligibleForDecision ? '是' : '否'}**。`,
  '',
  '## 排期差异',
  '',
  `- 可比排期：${result.intervalShadow.samples} 次。`,
  `- 当前固定规则中位间隔：${fmt(result.intervalShadow.fixedMedianDays)} 天。`,
  `- FSRS 中位间隔：${fmt(result.intervalShadow.fsrsMedianDays)} 天。`,
  `- 平均差异（FSRS - 固定）：${fmt(result.intervalShadow.meanDifferenceDays)} 天。`,
  '',
  '排期差异只能说明两种方法会给出不同日期，不能单独证明谁更好。',
  '',
  '## 预测影子指标',
  '',
  `- 共同样本：${result.predictiveShadow.samples}。`,
  `- Brier score（越低越好）：固定代理 ${fmt(result.predictiveShadow.fixedProxyBrier)}，FSRS ${fmt(result.predictiveShadow.fsrsBrier)}。`,
  `- Log loss（越低越好）：固定代理 ${fmt(result.predictiveShadow.fixedProxyLogLoss)}，FSRS ${fmt(result.predictiveShadow.fsrsLogLoss)}。`,
  '',
  '当样本量未达门槛时，上述数字只用于验证评测链路能跑通。',
  '',
  '## 证据',
  '',
  ...result.secondJudge.evidence.map(item => `- ${item}`),
  '',
  '## 验证方案',
  '',
  ...result.secondJudge.validationPlan.map(item => `- ${item}`),
  '',
  '## 局限',
  '',
  ...result.secondJudge.limitations.map(item => `- ${item}`),
  '',
  '## 评级映射',
  '',
  '- wrong / empty → Again',
  '- 答错后重输正确 → Hard',
  '- 第一次目标答案或可接受答案 → Good',
  '- 当前不产生 Easy，避免从缺失信号中伪造评级。',
  '',
].join('\n')

await fs.writeFile(path.join(reportDir, 'lingograb-fsrs-shadow-evaluation.md'), markdown)
console.log(JSON.stringify({
  source: result.source,
  events: result.dataReadiness.events,
  delayedOutcomeSamples: result.dataReadiness.delayedOutcomeSamples,
  eligibleForDecision: result.dataReadiness.eligibleForDecision,
  confidence: result.secondJudge.confidence,
}))
