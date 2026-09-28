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

  root.LingoGrabRouting = {
    norm,
    withoutMarks,
    editDistance,
    difficultCard,
    looksLikeNoise,
    classifyMistake,
    shouldAutoExplain,
  }
})(typeof globalThis !== 'undefined' ? globalThis : window)
