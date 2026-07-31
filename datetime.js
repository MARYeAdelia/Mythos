// Lógica de calendário: idade, estação por hemisfério, clima e feriados no trecho.

const MESES = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
]

// Cidades conhecidas → hemisfério. Fora da lista, assume norte (ajustável no capítulo).
const SUL = ['são paulo', 'sao paulo', 'rio de janeiro', 'rio', 'buenos aires', 'santiago', 'sydney', 'melbourne', 'cidade do cabo', 'joanesburgo', 'lima', 'montevidéu', 'montevideu', 'brasília', 'brasilia', 'sumaré', 'sumare', 'campinas']
// Cidades subtropicais/quentes onde "inverno" não é frio de neve.
const SUBTROPICAL = ['miami', 'los angeles', 'san diego', 'havana', 'cancún', 'cancun', 'dubai', 'phoenix']

export function parseISO(iso) {
  if (!iso || typeof iso !== 'string') return null
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (!m) return null
  return { y: +m[1], mo: +m[2], d: +m[3] }
}

export function formatDateBR(iso) {
  const p = parseISO(iso)
  if (!p) return ''
  return `${p.d} de ${MESES[p.mo - 1]}`
}

export function numFrom(y, mo, d) {
  return y * 10000 + mo * 100 + d
}

export function daysBetween(aISO, bISO) {
  const a = parseISO(aISO)
  const b = parseISO(bISO)
  if (!a || !b) return null
  const da = Date.UTC(a.y, a.mo - 1, a.d)
  const db = Date.UTC(b.y, b.mo - 1, b.d)
  return Math.round((db - da) / 86400000)
}

export function computeAge(birthISO, atISO) {
  const b = parseISO(birthISO)
  const at = parseISO(atISO)
  if (!b || !at) return null
  let age = at.y - b.y
  if (at.mo < b.mo || (at.mo === b.mo && at.d < b.d)) age -= 1
  return age >= 0 ? age : null
}

export function hemisphereOf(city, override) {
  if (override === 'norte' || override === 'sul') return override
  const c = (city || '').trim().toLowerCase()
  if (!c) return 'norte'
  if (SUL.some((s) => c.includes(s))) return 'sul'
  return 'norte'
}

// Estação meteorológica pelo mês e hemisfério.
export function seasonOf(month, hemisphere) {
  if (!month) return ''
  const norte = { 12: 'inverno', 1: 'inverno', 2: 'inverno', 3: 'primavera', 4: 'primavera', 5: 'primavera', 6: 'verão', 7: 'verão', 8: 'verão', 9: 'outono', 10: 'outono', 11: 'outono' }
  const s = norte[month]
  if (hemisphere === 'sul') {
    const inv = { inverno: 'verão', verão: 'inverno', primavera: 'outono', outono: 'primavera' }
    return inv[s]
  }
  return s
}

// Dica de clima curta a partir de estação + cidade.
export function climateHint(city, season) {
  const c = (city || '').trim().toLowerCase()
  const sub = SUBTROPICAL.some((s) => c.includes(s))
  if (!season) return ''
  if (sub) {
    if (season === 'inverno') return 'ameno e seco, sem neve'
    if (season === 'verão') return 'quente e úmido, pancadas de chuva'
    return 'clima ameno o ano todo'
  }
  const map = {
    inverno: 'frio, dias curtos, neve possível',
    verão: 'calor, dias longos',
    primavera: 'ameno, chuvas passageiras',
    outono: 'fresco, folhas caindo',
  }
  return map[season] || ''
}

// Feriados cujo dia cai dentro de [start, end]. Ignora ano; casa escopo com a cidade.
export function holidaysInRange(holidays, startISO, endISO, city) {
  const s = parseISO(startISO)
  if (!s) return []
  const e = parseISO(endISO) || s
  const startNum = numFrom(s.y, s.mo, s.d)
  const endNum = numFrom(e.y, e.mo, e.d)
  const c = (city || '').trim().toLowerCase()
  return (holidays || []).filter((h) => {
    if (h.scope === 'local') {
      if (!h.city || !c.includes(h.city.trim().toLowerCase())) return false
    }
    // tenta o dia do feriado no ano de início e no de fim (cobre virada de ano)
    const candA = numFrom(s.y, h.month, h.day)
    const candB = numFrom(e.y, h.month, h.day)
    return (candA >= startNum && candA <= endNum) || (candB >= startNum && candB <= endNum)
  })
}
