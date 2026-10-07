(function attachLingoGrabRouting(root) {
  function norm(value) {
    return String(value || '').trim().toLowerCase().normalize('NFC').replace(/[’']/g, "'").replace(/\s+/g, ' ')
  }

  function withoutMarks(value) {
    return norm(value).normalize('NFD').replace(/\p{M}/gu, '')
  }

  function editDistance(a, b) {
    const previous = Array.from({ length: b.length + 1 }, (_, index) => index)
    for (let i = 1; i <= a.length; i += 1) {
      let diagonal = previous[0]
      previous[0] = i
      for (let j = 1; j <= b.length; j += 1) {
        const above = previous[j]
        const cost = a[i - 1] === b[j - 1] ? 0 : 1
        previous[j] = Math.min(previous[j] + 1, previous[j - 1] + 1, diagonal + cost)
        diagonal = above
      }
    }
    return previous[b.length]
  }

  function difficultCard(card) {
    const levelRank = { A1: 1, A2: 2, B1: 3, B2: 4, C1: 5, C2: 6 }
    const complexRule = /条件式|虚拟式|复合过去时|最近过去时|过去分词|倒装|固定搭配|职场搭配/i
    return (levelRank[card.level] || 1) >= 4 || (card.grammar || []).some(tag => complexRule.test(tag))
  }

  function looksLikeNoise(value, language) {
    const allowed = language === 'fr'
      ? /^[a-zàâäæçéèêëîïôöœùûüÿ'’ -]+$/i
      : /^[a-z'’ -]+$/i
    if (!allowed.test(value)) return true
    if (/(.)\1{3,}/i.test(value) || /qwerty|asdf|zxcv/i.test(value)) return true
    const tokens = value.split(/[-\s]+/).filter(Boolean)
    return tokens.some(token => token.length >= 4 && !/[aeiouyàâäæéèêëîïôöœùûüÿ]/i.test(token))
  }

  function classifyMistake(value, card, language, dependencies = {}) {
    const normalized = norm(value)
    const target = norm(card.target)
    if (!normalized) return { kind: 'empty', message: '没有检测到输入，先重新填写正确答案。' }

    const plainValue = withoutMarks(normalized)
    const plainTarget = withoutMarks(target)
    const distance = editDistance(plainValue, plainTarget)
    const threshold = Math.max(plainValue.length, plainTarget.length) >= 7 ? 2 : 1

    if (plainValue === plainTarget && normalized !== target) {
      return { kind: 'typo', message: '词形基本正确，但重音符号或字符形式有差异；默认使用本地提示，你仍可主动调用 AI 深度讲解。' }
    }
    if (looksLikeNoise(normalized, language)) {
      return { kind: 'other', message: '这次输入不像一个完整的目标语言词或表达；先查看核心用法并重新输入。' }
    }

    const knownLanguageTerm = typeof dependencies.knownLanguageTerm === 'function'
      ? dependencies.knownLanguageTerm
      : () => false
    if (knownLanguageTerm(normalized, language)) {
      return { kind: 'semantic', message: '检测到你输入的是另一个真实词或表达，正在自动比较它与正确答案的语义差异。' }
    }
    if (distance <= threshold) {
      return { kind: 'typo', message: `与正确答案只差 ${distance} 处，像是拼写错误；默认使用本地提示，你仍可主动调用 AI 深度讲解。` }
    }
    if (difficultCard(card)) {
      return { kind: 'complex', message: '这道题的级别或语法结构较复杂，正在自动生成更深入的错因讲解。' }
    }
    return { kind: 'other', message: '先用词书核心用法帮助你重输；如仍不理解，可以点击 AI 深度讲解。' }
  }

  function shouldAutoExplain(route) {
    return !!route && ['semantic', 'complex'].includes(route.kind)
  }

  function gradeAnswer(value, card) {
    const answer = norm(value)
    const target = norm(card && card.target)
    if (!answer) return { kind: 'empty', correct: false, answer, target }
    if (answer === target) return { kind: 'target', correct: true, answer, target }
    const accepted = Array.isArray(card && card.acceptedAnswers)
      ? card.acceptedAnswers.map(norm).filter(Boolean)
      : []
    if (accepted.includes(answer)) return { kind: 'acceptable', correct: true, answer, target }
    return { kind: 'wrong', correct: false, answer, target }
  }

  function nextReview({ previousInterval = 0, correct = false, firstTry = false, today = new Date() } = {}) {
    const base = new Date(today)
    base.setHours(12, 0, 0, 0)
    const current = Math.max(0, Number(previousInterval) || 0)
    const interval = !correct ? 1 : firstTry ? ([1, 3, 7, 14, 30, 60].find(days => days > current) || 90) : 1
    base.setDate(base.getDate() + interval)
    const due = `${base.getFullYear()}-${String(base.getMonth() + 1).padStart(2, '0')}-${String(base.getDate()).padStart(2, '0')}`
    return { interval, due }
  }

  const EVENT_PROPERTY_KEYS = new Set([
    'language', 'path', 'source', 'result', 'retry', 'answerKind', 'mistakeKind',
    'cardKey', 'interval', 'due', 'total', 'firstTryCorrect', 'retried', 'scheduledReviews', 'delayedRecallRate', 'count',
    'textLengthBucket', 'mode', 'sessionId', 'rating', 'area', 'screen',
  ])

  function eventId(prefix = 'event', now = new Date()) {
    const random = Math.random().toString(36).slice(2, 9)
    return `${prefix}-${now.getTime()}-${random}`
  }

  function sanitizeEventProperties(properties = {}) {
    return Object.fromEntries(Object.entries(properties)
      .filter(([key, value]) => EVENT_PROPERTY_KEYS.has(key) && ['string', 'number', 'boolean'].includes(typeof value))
      .map(([key, value]) => [key, typeof value === 'string' ? value.slice(0, 120) : value]))
  }

  function createLearningEvent(name, properties = {}, now = new Date()) {
    return {
      id: eventId('event', now),
      name: String(name || 'unknown').slice(0, 60),
      timestamp: now.toISOString(),
      schemaVersion: 1,
      properties: sanitizeEventProperties(properties),
    }
  }

  function createReviewEvent({ cardKey, result, firstTry, previousInterval = 0, scheduledInterval = 0, due = '', source = 'deck', sessionId = '' } = {}, now = new Date()) {
    return {
      id: eventId('review', now),
      cardKey: String(cardKey || '').slice(0, 160),
      reviewedAt: now.toISOString(),
      result: ['target', 'acceptable', 'wrong', 'empty', 'retried'].includes(result) ? result : 'wrong',
      firstTry: Boolean(firstTry),
      previousInterval: Math.max(0, Number(previousInterval) || 0),
      scheduledInterval: Math.max(0, Number(scheduledInterval) || 0),
      due: /^\d{4}-\d{2}-\d{2}$/.test(due) ? due : '',
      source: source === 'picked' ? 'picked' : 'deck',
      sessionId: String(sessionId || '').slice(0, 120),
      schemaVersion: 1,
    }
  }

  function appendCappedUnique(existing = [], incoming = [], limit = 1000) {
    const byId = new Map()
    for (const item of [...existing, ...incoming]) {
      if (item && item.id) byId.set(item.id, item)
    }
    return [...byId.values()]
      .sort((a, b) => String(a.timestamp || a.reviewedAt || '').localeCompare(String(b.timestamp || b.reviewedAt || '')))
      .slice(-Math.max(1, Number(limit) || 1))
  }

  function summarizeReviewHistory(history = []) {
    const rows = Array.isArray(history) ? history : []
    const completed = rows.filter(item => ['target', 'acceptable', 'retried'].includes(item.result))
    const firstTry = completed.filter(item => item.firstTry).length
    const delayed = completed.filter(item => (Number(item.previousInterval) || 0) > 0)
    const delayedFirstTry = delayed.filter(item => item.firstTry).length
    const completionsByCard = new Map()
    for (const item of completed) {
      if (!item.cardKey) continue
      completionsByCard.set(item.cardKey, (completionsByCard.get(item.cardKey) || 0) + 1)
    }
    return {
      attempts: rows.length,
      completed: completed.length,
      firstTry,
      firstTryRate: completed.length ? Math.round(firstTry / completed.length * 100) : 0,
      retried: completed.filter(item => item.result === 'retried').length,
      acceptable: completed.filter(item => item.result === 'acceptable').length,
      wrongAttempts: rows.filter(item => ['wrong', 'empty'].includes(item.result)).length,
      delayedReviews: delayed.length,
      delayedFirstTry,
      delayedRecallRate: delayed.length ? Math.round(delayedFirstTry / delayed.length * 100) : null,
      repeatCards: [...completionsByCard.values()].filter(count => count >= 2).length,
    }
  }

  function upcomingReviewSchedule(studyRecords = {}, today = new Date(), days = 7) {
    const length = Math.max(1, Math.min(31, Number(days) || 7))
    const start = new Date(today)
    start.setHours(12, 0, 0, 0)
    const dateKey = date => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
    const rows = Array.from({ length }, (_, offset) => {
      const date = new Date(start)
      date.setDate(start.getDate() + offset)
      return { date: dateKey(date), offset, count: 0 }
    })
    for (const record of Object.values(studyRecords && typeof studyRecords === 'object' ? studyRecords : {})) {
      if (!record || !/^\d{4}-\d{2}-\d{2}$/.test(record.due || '')) continue
      const dueDate = new Date(`${record.due}T12:00:00`)
      if (Number.isNaN(dueDate.getTime())) continue
      const offset = Math.round((dueDate.getTime() - start.getTime()) / 86400000)
      if (offset < 0) rows[0].count += 1
      else if (offset < rows.length) rows[offset].count += 1
    }
    return rows
  }

  root.LingoGrabRouting = {
    norm,
    withoutMarks,
    editDistance,
    difficultCard,
    looksLikeNoise,
    classifyMistake,
    shouldAutoExplain,
    gradeAnswer,
    nextReview,
    sanitizeEventProperties,
    createLearningEvent,
    createReviewEvent,
    appendCappedUnique,
    summarizeReviewHistory,
    upcomingReviewSchedule,
  }
})(typeof globalThis !== 'undefined' ? globalThis : window)
