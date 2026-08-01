import {
  computeAge,
  hemisphereOf,
  seasonOf,
  climateHint,
  holidaysInRange,
  formatDateBR,
  daysBetween,
  parseISO,
} from './datetime.js'

function charLines(c) {
  const L = []
  const head = c.role ? `${c.name} (${c.role})` : c.name
  L.push(`• ${head}`)
  const id = []
  if (c.gender) id.push(`gênero: ${c.gender}`)
  if (c.pronouns) id.push(`pronomes/tratamento: ${c.pronouns}`)
  if (id.length) L.push(`  ${id.join(' — ')}`)

  const corpo = []
  if (c.height) corpo.push(`altura ${c.height}`)
  if (c.eyes) corpo.push(`olhos ${c.eyes}`)
  if (c.skin) corpo.push(`pele ${c.skin}`)
  if (c.hair) corpo.push(`cabelo ${c.hair}`)
  if (c.build) corpo.push(`porte ${c.build}`)
  if (c.chest) corpo.push(`seios: ${c.chest}`)
  if (corpo.length) L.push(`  corpo: ${corpo.join(', ')}.`)
  if (c.anatomy) L.push(`  anatomia/marcas (travar): ${c.anatomy}.`)

  const sens = []
  if (c.scent) sens.push(`perfume: ${c.scent}`)
  if (c.voice) sens.push(`voz: ${c.voice}`)
  if (c.gesture) sens.push(`gesto: ${c.gesture}`)
  if (sens.length) L.push(`  assinatura: ${sens.join('; ')}.`)

  const estilo = []
  if (c.aesthetic) estilo.push(`estética ${c.aesthetic}`)
  if (c.lookEveryday) estilo.push(`dia a dia: ${c.lookEveryday}`)
  if (c.lookFormal) estilo.push(`festa/formal: ${c.lookFormal}`)
  if (c.colors) estilo.push(`cores: ${c.colors}`)
  if (estilo.length) L.push(`  figurino: ${estilo.join('; ')}.`)

  const mundo = []
  if (c.residence) mundo.push(`mora em ${c.residence}`)
  if (c.transport) mundo.push(`locomoção: ${c.transport}`)
  if (c.occupation) mundo.push(`ocupação: ${c.occupation}`)
  if (c.signatureObject) mundo.push(`objeto-marca: ${c.signatureObject}`)
  if (mundo.length) L.push(`  mundo: ${mundo.join('; ')}.`)

  const interior = []
  if (c.qualities?.length) interior.push(`qualidades: ${c.qualities.join(', ')}`)
  if (c.flaws?.length) interior.push(`defeitos/feridas: ${c.flaws.join(', ')}`)
  if (c.desire) interior.push(`desejo: ${c.desire}`)
  if (c.fear) interior.push(`medo: ${c.fear}`)
  if (interior.length) L.push(`  interior: ${interior.join('; ')}.`)

  if (c.notes) L.push(`  notas: ${c.notes}`)
  return L.join('\n')
}

export function buildSystemPrompt(p) {
  const chars = (p.characters || []).filter((c) => c.name && c.name.trim())
  const banned = (p.bannedWords || []).map((w) => w.trim()).filter(Boolean)
  const forbidden = (p.forbiddenNames || []).map((n) => n.trim()).filter(Boolean)
  const L = []

  L.push(
    'Você é coautora de ficção literária adulta, colaborando com uma escritora ' +
      'profissional brasileira. Todo o conteúdo é ficção entre personagens adultas ' +
      '(maiores de idade), com intenção artística. O tom pode ser sombrio, tenso e ' +
      'psicologicamente complexo quando a narrativa pedir. Escreva em português do Brasil.',
  )
  L.push('')
  L.push(`PROJETO: ${p.title || 'sem título'}`)
  if (p.logline?.trim()) L.push(`Premissa: ${p.logline.trim()}`)
  L.push('')

  if (chars.length) {
    L.push('FICHAS DOS PERSONAGENS (fatos travados — respeite cada traço; não invente nem altere):')
    for (const c of chars) L.push(charLines(c))
    L.push('')
  }
  if (p.setting?.trim()) {
    L.push('CENÁRIO / ATMOSFERA GERAL:')
    L.push(p.setting.trim())
    L.push('')
  }

  L.push('REGRAS DE ESTILO (obrigatórias):')
  if (p.styleGuide?.trim()) L.push(p.styleGuide.trim())
  if (banned.length) L.push(`- Palavras PROIBIDAS, nunca use em nenhuma flexão: ${banned.join(', ')}.`)
  if (forbidden.length) L.push(`- Nomes que NÃO podem aparecer: ${forbidden.join(', ')}.`)
  if (p.pronounRules?.trim()) L.push(`- Regras de pronome/tratamento: ${p.pronounRules.trim()}`)
  L.push('')

  if (p.sceneMode === 'placeholder') {
    L.push(
      'CENAS ÍNTIMAS EXPLÍCITAS: não escreva conteúdo sexual explícito. Deixe o marcador ' +
        '[CENA ÍNTIMA — ESCREVER PELA AUTORA] em linha própria e retome depois.',
    )
  } else {
    L.push(
      'INTENSIDADE: escreva cada cena por completo — intimidade explícita, violência ou ' +
        'agressão — com a mesma corporeidade e peso emocional do resto. Sem cortes, "fade", ' +
        'eufemismo ou marcadores. Mantenha cuidado literário: ritmo, subtexto, consequência.',
    )
  }
  L.push('Entregue apenas a prosa do capítulo: sem títulos, notas ou meta-comentário.')
  return L.join('\n')
}

// Contexto temporal do capítulo + idades nesta data.
export function chapterContext(p, chapter) {
  const L = []
  const start = chapter.startDate
  const s = parseISO(start)
  if (!s) return ''

  const hemi = hemisphereOf(chapter.local, chapter.hemisphere)
  const seasonStart = seasonOf(s.mo, hemi)
  const e = parseISO(chapter.endDate)
  const dur = e ? daysBetween(start, chapter.endDate) : 0

  L.push('QUANDO E ONDE SE PASSA ESTE CAPÍTULO:')
  if (e && dur > 0) {
    L.push(`- Trecho: de ${formatDateBR(start)} a ${formatDateBR(chapter.endDate)} (dura ${dur} dia(s)).`)
  } else {
    L.push(`- Data: ${formatDateBR(start)}.`)
  }
  if (chapter.timeOfDay) L.push(`- Hora do dia: ${chapter.timeOfDay}.`)
  if (chapter.local) L.push(`- Local: ${chapter.local}.`)

  const seasonEnd = e ? seasonOf(e.mo, hemi) : seasonStart
  if (seasonEnd && seasonEnd !== seasonStart) {
    L.push(`- Estação: começa no ${seasonStart}, termina no ${seasonEnd} — descreva a virada.`)
  } else if (seasonStart) {
    L.push(`- Estação: ${seasonStart}.`)
  }
  const clima = chapter.climateOverride?.trim() || climateHint(chapter.local, seasonStart)
  if (clima) L.push(`- Clima esperado: ${clima}. O ambiente deve ser coerente com isso.`)

  const hols = holidaysInRange(p.holidays, start, chapter.endDate, chapter.local)
  if (hols.length) {
    L.push(`- Datas comemorativas no trecho: ${hols.map((h) => h.name).join(', ')}. Reflita o clima da(s) data(s) na cena (decoração, ritmo da cidade, ânimo).`)
  }

  // idades na data
  const ages = (p.characters || [])
    .filter((c) => c.name?.trim() && c.birthdate)
    .map((c) => {
      const age = computeAge(c.birthdate, start)
      return age != null ? `${c.name}: ${age} anos` : null
    })
    .filter(Boolean)
  if (ages.length) L.push(`- Idades nesta data: ${ages.join('; ')}.`)

  return L.join('\n')
}

export function buildUserPrompt({ project, chapter, prevChapter, priorChapters }) {
  const L = []

  // Memória longa: resumos dos capítulos anteriores.
  const resumos = (priorChapters || [])
    .filter((c) => c.summary && c.summary.trim())
    .map((c) => `- Cap. ${c.number}: ${c.summary.trim()}`)
  if (resumos.length) {
    L.push('HISTÓRIA ATÉ AQUI (resumo dos capítulos anteriores — mantenha coerência com tudo isto):')
    L.push(resumos.join('\n'))
    L.push('')
  }

  const ctx = chapterContext(project, chapter)
  if (ctx) {
    L.push(ctx)
    if (prevChapter && (prevChapter.endDate || prevChapter.startDate)) {
      const prevEnd = prevChapter.endDate || prevChapter.startDate
      const gap = daysBetween(prevEnd, chapter.startDate)
      if (gap != null && gap !== 0) {
        L.push(`- Desde o capítulo anterior passaram ${gap} dia(s).`)
      }
    }
    L.push('')
  }

  if (prevChapter?.text?.trim()) {
    L.push('FINAL DO CAPÍTULO ANTERIOR (continuidade — não repita, continue a partir do clima):')
    L.push('"""')
    L.push(tailOf(prevChapter.text))
    L.push('"""')
    L.push('')
  }

  const povTxt = chapter.pov ? `, em POV de ${chapter.pov}` : ''
  L.push(`Escreva o Capítulo ${chapter.number ?? ''}${povTxt}.`)
  if (chapter.targetWords) L.push(`Extensão-alvo: cerca de ${chapter.targetWords} palavras.`)
  L.push('')
  L.push('Direção do capítulo:')
  L.push(
    chapter.direction?.trim() ||
      '(sem direção específica — desenvolva a cena a partir das fichas e do clima)',
  )
  return L.join('\n')
}

export function tailOf(text, words = 180) {
  if (!text) return ''
  const arr = text.trim().split(/\s+/)
  return arr.length <= words ? text.trim() : arr.slice(-words).join(' ')
}

// Prompt para o app resumir um capítulo pronto (memória longa automática).
export function buildSummaryPrompt(chapterText) {
  return (
    'Resuma o capítulo abaixo em 2 a 3 frases objetivas, em português do Brasil, ' +
    'registrando só o que aconteceu de fato relevante para a continuidade (eventos, ' +
    'decisões, mudanças de relação, revelações). Sem floreio, sem opinião, sem título.\n\n' +
    '"""\n' + (chapterText || '').trim() + '\n"""'
  )
}
