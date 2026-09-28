import fs from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(here, '..')
await import(path.join(root, 'assets/learning-routing.js'))
const routing = globalThis.LingoGrabRouting

function hasFlag(name) { return process.argv.includes(name) }
function arg(name, fallback) {
  const index = process.argv.indexOf(name)
  return index >= 0 && process.argv[index + 1] ? process.argv[index + 1] : fallback
}

async function readJsonl(name) {
  const raw = await fs.readFile(path.join(here, 'datasets', `${name}.jsonl`), 'utf8')
  return raw.split(/\r?\n/).filter(Boolean).map(line => JSON.parse(line))
}

function parseFrequency(raw, language) {
  const pattern = language === 'en'
    ? /^[a-z]+(?:['’-][a-z]+)?$/i
    : /^[a-zàâäæçéèêëîïôöœùûüÿ]+(?:['’-][a-zàâäæçéèêëîïôöœùûüÿ]+)?$/i
  const output = []
  const seen = new Set()
  for (const line of raw.split(/\r?\n/)) {
    const split = line.lastIndexOf(' ')
    if (split < 1) continue
    const word = routing.norm(line.slice(0, split))
    if (!pattern.test(word) || seen.has(word)) continue
    seen.add(word)
    output.push(word)
    if (output.length === 5000) break
  }
  return new Set(output)
}

const curated = {
  en: new Set(['clarify', 'align', 'prioritize', 'update', 'scope', 'feedback', 'follow up', 'review']),
  fr: new Set(['savez', 'savoir', 'pouvez', 'pouvoir', 'devons', 'devoir', 'voudrais', 'vouloir', 'allons', 'aller', 'viens', 'venir', 'faisons', 'faire', 'pris', 'prendre', "m'appelle", "s'appeler", 'habite', 'aime', 'sommes', 'réservé', 'perdu', 'addition', 'billet', 'où']),
}

async function knownTermFactory() {
  const indexes = {}
  for (const language of ['en', 'fr']) {
    indexes[language] = parseFrequency(await fs.readFile(path.join(root, 'data', `${language}_50k.txt`), 'utf8'), language)
  }
  const isKnownSingle = (value, language) => indexes[language].has(value) || curated[language].has(value)
  return (value, language) => {
    const normalized = routing.norm(value)
    if (!/^[a-zàâäæçéèêëîôöœùûüÿ'’ -]+$/i.test(normalized)) return false
    const tokens = normalized.split(/[\s-]+/).filter(Boolean)
    return tokens.length === 1 ? isKnownSingle(normalized, language) : tokens.every(token => isKnownSingle(token, language))
  }
}

function percent(value, total) { return total ? Math.round(value / total * 1000) / 10 : 0 }
function median(values) {
  if (!values.length) return null
  const sorted = [...values].sort((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[middle] : Math.round((sorted[middle - 1] + sorted[middle]) / 2)
}
function percentile(values, p) {
  if (!values.length) return null
  const sorted = [...values].sort((a, b) => a - b)
  return sorted[Math.min(sorted.length - 1, Math.ceil(sorted.length * p) - 1)]
}

function currentCodeVersion() {
  try {
    return execFileSync('git', ['rev-parse', '--short', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim()
  } catch {
    return 'unknown'
  }
}

async function evaluateRouting() {
  const cases = await readJsonl('routing')
  const knownLanguageTerm = await knownTermFactory()
  const rows = cases.map(item => {
    const predicted = routing.classifyMistake(item.answer, item.card, item.language, { knownLanguageTerm })
    const expectedAuto = ['semantic', 'complex'].includes(item.gold)
    const actualAuto = routing.shouldAutoExplain(predicted)
    return { ...item, predicted: predicted.kind, routePass: predicted.kind === item.gold, expectedAuto, actualAuto, autoPass: expectedAuto === actualAuto }
  })
  const routePasses = rows.filter(row => row.routePass).length
  const autoPasses = rows.filter(row => row.autoPass).length
  return {
    total: rows.length,
    routePasses,
    routeAccuracy: percent(routePasses, rows.length),
    autoPasses,
    autoDecisionAccuracy: percent(autoPasses, rows.length),
    failures: rows.filter(row => !row.routePass || !row.autoPass),
    byGold: Object.fromEntries([...new Set(rows.map(row => row.gold))].map(kind => {
      const subset = rows.filter(row => row.gold === kind)
      return [kind, { total: subset.length, passes: subset.filter(row => row.routePass).length }]
    })),
  }
}

async function postCase(body, endpoint) {
  const started = performance.now()
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Origin: 'https://lingograb.getyuli.com',
        'Content-Type': 'application/json',
        'User-Agent': 'LingoGrab-Eval/1.0',
      },
      body: JSON.stringify(body),
    })
    const data = await response.json().catch(() => ({}))
    return { ok: response.ok, status: response.status, latencyMs: Math.round(performance.now() - started), ...data }
  } catch (error) {
    return { ok: false, status: 0, latencyMs: Math.round(performance.now() - started), error: String(error && error.message || error) }
  }
}

function groupMatches(content, group) {
  const normalized = String(content || '').toLowerCase()
  return group.some(term => normalized.includes(String(term).toLowerCase()))
}

function scoreExplanation(item, result) {
  const content = String(result.content || '')
  const required = item.requiredGroups.map(group => ({ group, pass: groupMatches(content, group) }))
  const forbiddenHits = item.forbidden.filter(term => content.toLowerCase().includes(term.toLowerCase()))
  const structurePass = item.language === 'fr' || (/为什么/.test(content) && /易错点/.test(content) && /例句/.test(content))
  const automaticPass = result.ok && required.every(check => check.pass) && forbiddenHits.length === 0 && structurePass
  return { ...item, result, required, forbiddenHits, structurePass, automaticPass }
}

function parseArray(raw) {
  const cleaned = String(raw || '').replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim()
  const start = cleaned.indexOf('[')
  const end = cleaned.lastIndexOf(']')
  if (start < 0 || end < start) return null
  try { return JSON.parse(cleaned.slice(start, end + 1)) } catch { return null }
}

function redactForEval(value) {
  return String(value || '')
    .replace(/\b[A-Z][a-z]{1,24}\s+[A-Z][a-z]{1,24}\b/g, '[姓名]')
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[邮箱]')
    .replace(/(?:\+?\d[\d\s-]{8,}\d)/g, '[电话]')
}

function scoreExtraction(item, result) {
  const array = parseArray(result.content)
  const validLength = Array.isArray(array) && array.length >= 3 && array.length <= 6
  const validSchema = validLength && array.every(entry => entry && typeof entry.target === 'string' && typeof entry.meaning === 'string' && typeof entry.example === 'string' && entry.lang === item.language && /^(A1|A2|B1|B2|C1|C2)$/.test(entry.level))
  const combined = JSON.stringify(array || []).toLowerCase()
  const expectedHits = item.expectedAny.filter(term => combined.includes(term.toLowerCase()))
  const prohibitedHits = item.prohibited.filter(term => combined.includes(term.toLowerCase()))
  const source = routing.norm(redactForEval(item.text))
  const targetGrounded = validLength ? array.filter(entry => source.includes(routing.norm(entry.target))).length : 0
  const exampleGrounded = validLength ? array.filter(entry => source.includes(routing.norm(entry.example))).length : 0
  const relevancePass = expectedHits.length >= Math.min(2, item.expectedAny.length)
  const automaticPass = result.ok && validLength && validSchema && relevancePass && prohibitedHits.length === 0 && targetGrounded === array.length && exampleGrounded === array.length
  return { ...item, result, array, validLength, validSchema, expectedHits, prohibitedHits, targetGrounded, exampleGrounded, relevancePass, automaticPass }
}

async function runRespectingRateLimit(tasks, maxPerMinute = 7) {
  const output = []
  let windowStartedAt = Date.now()
  let used = 0
  for (const task of tasks) {
    const elapsed = Date.now() - windowStartedAt
    if (elapsed >= 60000) {
      windowStartedAt = Date.now()
      used = 0
    }
    if (used >= maxPerMinute) {
      const waitMs = Math.max(0, 61000 - (Date.now() - windowStartedAt))
      process.stdout.write(`\n等待 ${Math.ceil(waitMs / 1000)} 秒进入下一分钟额度…\n`)
      await new Promise(resolve => setTimeout(resolve, waitMs))
      windowStartedAt = Date.now()
      used = 0
    }
    output.push(await task())
    used += 1
  }
  return output
}

async function evaluateLive(endpoint) {
  const explanations = await readJsonl('explanations')
  const extraction = await readJsonl('extraction')
  const tasks = [
    ...explanations.map(item => async () => ({ type: 'explanation', item, result: await postCase({ task: 'explain', language: item.language, card: item.card, userAnswer: item.userAnswer, correct: false, mistakeKind: 'semantic' }, endpoint) })),
    ...extraction.map(item => async () => ({ type: 'extraction', item, result: await postCase({ task: 'extract', text: item.text }, endpoint) })),
  ]
  const raw = await runRespectingRateLimit(tasks)
  const explanationRows = raw.filter(row => row.type === 'explanation').map(row => scoreExplanation(row.item, row.result))
  const extractionRows = raw.filter(row => row.type === 'extraction').map(row => scoreExtraction(row.item, row.result))
  const allResults = raw.map(row => row.result)
  const latencies = allResults.filter(row => row.ok).map(row => row.latencyMs)
  const available = allResults.filter(row => row.ok).length
  return {
    endpoint,
    total: raw.length,
    available,
    availability: percent(available, raw.length),
    latency: { medianMs: median(latencies), p95Ms: percentile(latencies, 0.95), minMs: latencies.length ? Math.min(...latencies) : null, maxMs: latencies.length ? Math.max(...latencies) : null },
    models: Object.fromEntries([...new Set(allResults.map(row => row.model || row.error || `HTTP ${row.status}`))].map(model => [model, allResults.filter(row => (row.model || row.error || `HTTP ${row.status}`) === model).length])),
    degradedCount: allResults.filter(row => row.degraded).length,
    explanations: {
      total: explanationRows.length,
      passes: explanationRows.filter(row => row.automaticPass).length,
      automaticPassRate: percent(explanationRows.filter(row => row.automaticPass).length, explanationRows.length),
      rows: explanationRows,
    },
    extraction: {
      total: extractionRows.length,
      passes: extractionRows.filter(row => row.automaticPass).length,
      automaticPassRate: percent(extractionRows.filter(row => row.automaticPass).length, extractionRows.length),
      schemaPassRate: percent(extractionRows.filter(row => row.validSchema).length, extractionRows.length),
      relevancePassRate: percent(extractionRows.filter(row => row.relevancePass).length, extractionRows.length),
      privacyPassRate: percent(extractionRows.filter(row => row.prohibitedHits.length === 0).length, extractionRows.length),
      rows: extractionRows,
    },
  }
}

function markdown(report) {
  const lines = [
    '# LingoGrab 首版专项评测报告',
    '',
    `- 运行时间：${report.generatedAt}`,
    `- 代码版本：${report.codeVersion}`,
    `- 评测集：错误分流 ${report.routing.total} 条${report.live ? `；讲解 ${report.live.explanations.total} 条；语料精选 ${report.live.extraction.total} 条` : ''}`,
    '',
    '## 结论',
    '',
    `- 错误类型分流准确率：**${report.routing.routeAccuracy}%（${report.routing.routePasses}/${report.routing.total}）**。`,
    `- 自动调用 AI 决策准确率：**${report.routing.autoDecisionAccuracy}%（${report.routing.autoPasses}/${report.routing.total}）**。`,
  ]
  if (report.live) {
    lines.push(
      `- 线上服务可用率：**${report.live.availability}%（${report.live.available}/${report.live.total}）**。`,
      `- 讲解自动规则通过率：**${report.live.explanations.automaticPassRate}%（${report.live.explanations.passes}/${report.live.explanations.total}）**。`,
      `- 语料精选综合通过率：**${report.live.extraction.automaticPassRate}%（${report.live.extraction.passes}/${report.live.extraction.total}）**；格式 ${report.live.extraction.schemaPassRate}%，相关性 ${report.live.extraction.relevancePassRate}%，隐私 ${report.live.extraction.privacyPassRate}%。`,
      `- 响应时延：中位数 **${report.live.latency.medianMs} ms**，P95 **${report.live.latency.p95Ms} ms**；降级响应 ${report.live.degradedCount}/${report.live.total}。`,
      `- 实际模型分布：${Object.entries(report.live.models).map(([model, count]) => `${model} ${count} 次`).join('；')}。`,
    )
    if (report.live.explanations.humanReview) {
      const review = report.live.explanations.humanReview
      lines.push(`- AI 讲解人工通过率：**${review.passRate}%（${review.passes}/${review.reviewed}）**；方法：${review.method}。`)
    }
  }
  lines.push('', '## 错误分流明细', '', '| 金标 | 通过 / 总数 |', '|---|---:|')
  for (const [kind, value] of Object.entries(report.routing.byGold)) lines.push(`| ${kind} | ${value.passes} / ${value.total} |`)
  if (report.routing.failures.length) {
    lines.push('', '### 分流失败案例', '')
    for (const item of report.routing.failures) lines.push(`- ${item.id}：期望 ${item.gold}，实际 ${item.predicted}；自动调用期望 ${item.expectedAuto ? '是' : '否'}，实际 ${item.actualAuto ? '是' : '否'}。`)
  }
  if (report.live) {
    lines.push('', '## AI 讲解逐例结果', '')
    for (const row of report.live.explanations.rows) lines.push(`### ${row.id} · ${row.automaticPass ? '自动通过' : '自动未通过'}${row.humanReview ? ` · 人工${row.humanReview.pass ? '通过' : '未通过'}` : ''}\n\n- 模型：${row.result.model || row.result.error || `HTTP ${row.result.status}`}；时延：${row.result.latencyMs} ms\n- 输出：${String(row.result.content || row.result.error || '').replace(/\n/g, ' ')}\n- 缺失要求：${row.required.filter(check => !check.pass).map(check => check.group.join('/')).join('；') || '无'}\n- 禁止项命中：${row.forbiddenHits.join('；') || '无'}${row.humanReview ? `\n- 人工结论：${row.humanReview.reason}` : ''}\n`)
    lines.push('', '## AI 语料精选逐例结果', '')
    for (const row of report.live.extraction.rows) lines.push(`### ${row.id} · ${row.automaticPass ? '通过' : '未通过'}\n\n- 模型：${row.result.model || row.result.error || `HTTP ${row.result.status}`}；时延：${row.result.latencyMs} ms\n- 格式：${row.validSchema ? '通过' : '未通过'}；相关性：${row.relevancePass ? '通过' : '未通过'}；隐私：${row.prohibitedHits.length ? `未通过（${row.prohibitedHits.join('、')}）` : '通过'}\n- 原文落地：target ${row.targetGrounded}/${row.array?.length || 0}；example ${row.exampleGrounded}/${row.array?.length || 0}\n- 推荐：${(row.array || []).map(entry => entry.target).join('；') || '无'}\n`)
  }
  lines.push('', '## 口径边界', '', '- 这是小样本离线专项评测，不等于真实用户学习效果。', '- “自动规则通过率”是按固定金标和禁用项机械验收；人工教学有效性仍需逐例复核。', '- 自动化测试、专项离线评测和真实用户效果应在简历中分别表述，不得互相替代。', '')
  return lines.join('\n')
}

function applyHumanReview(report, review) {
  if (!report.live || !report.live.explanations) throw new Error('report_has_no_live_explanations')
  const rows = report.live.explanations.rows
  for (const row of rows) {
    if (review.cases[row.id]) row.humanReview = review.cases[row.id]
  }
  const reviewedRows = rows.filter(row => row.humanReview && typeof row.humanReview.pass === 'boolean')
  const passes = reviewedRows.filter(row => row.humanReview.pass).length
  report.live.explanations.humanReview = {
    reviewed: reviewedRows.length,
    passes,
    passRate: percent(passes, reviewedRows.length),
    method: review.method || '逐例检查事实、错因解释与示例是否使用正确答案',
    reviewer: review.reviewer || '产品自评',
  }
  return report
}

const rescorePath = arg('--rescore', '')
if (rescorePath) {
  const reportPath = path.resolve(process.cwd(), rescorePath)
  const reviewPath = path.resolve(process.cwd(), arg('--review', path.join(here, 'reviews', 'human-review.json')))
  const report = applyHumanReview(JSON.parse(await fs.readFile(reportPath, 'utf8')), JSON.parse(await fs.readFile(reviewPath, 'utf8')))
  report.codeVersion = currentCodeVersion()
  const markdownPath = reportPath.replace(/\.json$/i, '.md')
  await fs.writeFile(reportPath, JSON.stringify(report, null, 2))
  await fs.writeFile(markdownPath, markdown(report))
  process.stdout.write(`${markdown(report).split('\n').slice(0, 20).join('\n')}\n\n复核报告：${markdownPath}\n`)
  process.exit(0)
}

const routingReport = await evaluateRouting()
const live = hasFlag('--live') ? await evaluateLive(arg('--endpoint', 'https://www.getyuli.com/api/pickup')) : null
const now = new Date()
const stamp = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now)
const codeVersion = currentCodeVersion()
const report = { generatedAt: now.toISOString(), codeVersion, routing: routingReport, live }
await fs.mkdir(path.join(here, 'reports'), { recursive: true })
const base = path.join(here, 'reports', `lingograb-eval-${stamp}`)
await fs.writeFile(`${base}.json`, JSON.stringify(report, null, 2))
await fs.writeFile(`${base}.md`, markdown(report))
process.stdout.write(`${markdown(report).split('\n').slice(0, 18).join('\n')}\n\n报告：${base}.md\n`)
