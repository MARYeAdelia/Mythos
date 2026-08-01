import React, { useState, useEffect, useMemo, useRef } from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'

// ===================== datetime.js =====================
// Lógica de calendário: idade, estação por hemisfério, clima e feriados no trecho.

const MESES = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
]

// Cidades conhecidas → hemisfério. Fora da lista, assume norte (ajustável no capítulo).
const SUL = ['são paulo', 'sao paulo', 'rio de janeiro', 'rio', 'buenos aires', 'santiago', 'sydney', 'melbourne', 'cidade do cabo', 'joanesburgo', 'lima', 'montevidéu', 'montevideu', 'brasília', 'brasilia', 'sumaré', 'sumare', 'campinas']
// Cidades subtropicais/quentes onde "inverno" não é frio de neve.
const SUBTROPICAL = ['miami', 'los angeles', 'san diego', 'havana', 'cancún', 'cancun', 'dubai', 'phoenix']

function parseISO(iso) {
  if (!iso || typeof iso !== 'string') return null
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (!m) return null
  return { y: +m[1], mo: +m[2], d: +m[3] }
}

function formatDateBR(iso) {
  const p = parseISO(iso)
  if (!p) return ''
  return `${p.d} de ${MESES[p.mo - 1]}`
}

function numFrom(y, mo, d) {
  return y * 10000 + mo * 100 + d
}

function daysBetween(aISO, bISO) {
  const a = parseISO(aISO)
  const b = parseISO(bISO)
  if (!a || !b) return null
  const da = Date.UTC(a.y, a.mo - 1, a.d)
  const db = Date.UTC(b.y, b.mo - 1, b.d)
  return Math.round((db - da) / 86400000)
}

function computeAge(birthISO, atISO) {
  const b = parseISO(birthISO)
  const at = parseISO(atISO)
  if (!b || !at) return null
  let age = at.y - b.y
  if (at.mo < b.mo || (at.mo === b.mo && at.d < b.d)) age -= 1
  return age >= 0 ? age : null
}

function hemisphereOf(city, override) {
  if (override === 'norte' || override === 'sul') return override
  const c = (city || '').trim().toLowerCase()
  if (!c) return 'norte'
  if (SUL.some((s) => c.includes(s))) return 'sul'
  return 'norte'
}

// Estação meteorológica pelo mês e hemisfério.
function seasonOf(month, hemisphere) {
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
function climateHint(city, season) {
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
function holidaysInRange(holidays, startISO, endISO, city) {
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

// ===================== store.js =====================
const KEY = 'escrivaninha.v2'

function uid() {
  return Math.random().toString(36).slice(2, 10)
}

function loadState() {
  try {
    const raw = localStorage.getItem(KEY) || localStorage.getItem('escrivaninha.v1')
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function saveState(state) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
  } catch {
    /* ignora */
  }
}

function newCharacter() {
  return {
    id: uid(),
    // identidade
    name: '',
    role: '',
    birthdate: '',
    gender: '',
    pronouns: '',
    // corpo
    height: '',
    eyes: '',
    skin: '',
    hair: '',
    build: '',
    chest: '',
    anatomy: '',
    // sensorial
    scent: '',
    voice: '',
    gesture: '',
    // estilo
    aesthetic: '',
    lookEveryday: '',
    lookFormal: '',
    colors: '',
    // mundo
    residence: '',
    transport: '',
    occupation: '',
    signatureObject: '',
    // interior
    qualities: [],
    flaws: [],
    desire: '',
    fear: '',
    notes: '',
  }
}

function newChapter(number = 1) {
  return {
    id: uid(),
    number,
    pov: '',
    targetWords: 4000,
    direction: '',
    text: '',
    summary: '',
    // tempo
    startDate: '',
    endDate: '',
    timeOfDay: '',
    local: '',
    hemisphere: 'auto', // 'auto' | 'norte' | 'sul'
    climateOverride: '',
  }
}

function universalHolidays() {
  return [
    { id: uid(), name: 'Véspera de Natal', month: 12, day: 24, scope: 'universal', city: '' },
    { id: uid(), name: 'Natal', month: 12, day: 25, scope: 'universal', city: '' },
    { id: uid(), name: 'Réveillon', month: 12, day: 31, scope: 'universal', city: '' },
    { id: uid(), name: 'Ano Novo', month: 1, day: 1, scope: 'universal', city: '' },
  ]
}

function newProject(title = 'Novo projeto') {
  return {
    id: uid(),
    title,
    logline: '',
    setting: '',
    characters: [newCharacter()],
    holidays: universalHolidays(),
    styleGuide:
      '- Capítulos longos e densos.\n' +
      '- Diálogo com peso e subtexto; o que não é dito importa tanto quanto o que é.\n' +
      '- Corporeidade detalhada: postura, respiração, olhar, tensão na mandíbula, mãos.\n' +
      '- Emoção construída devagar, sem atalhos nem resumo emocional.\n' +
      '- Cenas imersivas, nunca narração expositiva.',
    bannedWords: ['qualidade'],
    forbiddenNames: [],
    pronounRules: '',
    sceneMode: 'full',
    model: 'cognitivecomputations/dolphin-mistral-24b-venice-edition:free',
    chapters: [newChapter(1)],
    currentChapterId: null,
  }
}

// Garante que projetos antigos ganhem os campos novos sem quebrar.
function normalizeProject(p) {
  const base = newProject()
  const merged = { ...base, ...p }
  merged.characters = (p.characters || [base.characters[0]]).map((c) => ({
    ...newCharacter(),
    ...c,
    qualities: Array.isArray(c.qualities) ? c.qualities : [],
    flaws: Array.isArray(c.flaws) ? c.flaws : [],
  }))
  merged.chapters = (p.chapters || [base.chapters[0]]).map((ch) => ({
    ...newChapter(ch.number || 1),
    ...ch,
  }))
  merged.holidays = Array.isArray(p.holidays) && p.holidays.length ? p.holidays : universalHolidays()
  merged.bannedWords = Array.isArray(p.bannedWords) ? p.bannedWords : ['qualidade']
  merged.forbiddenNames = Array.isArray(p.forbiddenNames) ? p.forbiddenNames : []
  return merged
}

// ===================== prompt.js =====================

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

function buildSystemPrompt(p) {
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
function chapterContext(p, chapter) {
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

function buildUserPrompt({ project, chapter, prevChapter, priorChapters }) {
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

function tailOf(text, words = 180) {
  if (!text) return ''
  const arr = text.trim().split(/\s+/)
  return arr.length <= words ? text.trim() : arr.slice(-words).join(' ')
}

// Prompt para o app resumir um capítulo pronto (memória longa automática).
function buildSummaryPrompt(chapterText) {
  return (
    'Resuma o capítulo abaixo em 2 a 3 frases objetivas, em português do Brasil, ' +
    'registrando só o que aconteceu de fato relevante para a continuidade (eventos, ' +
    'decisões, mudanças de relação, revelações). Sem floreio, sem opinião, sem título.\n\n' +
    '"""\n' + (chapterText || '').trim() + '\n"""'
  )
}

// ===================== exporters.js =====================
// Exportação para Word (.doc via HTML — abre perfeitamente no Word) e backup em JSON.

function download(filename, blob) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

function esc(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function slug(s) {
  return (s || 'sem-titulo').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'arquivo'
}

function wrapDoc(title, bodyHtml) {
  return (
    '<!DOCTYPE html><html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word">' +
    '<head><meta charset="utf-8"><title>' + esc(title) + '</title>' +
    '<style>body{font-family:Georgia,serif;font-size:12pt;line-height:1.6;color:#111}' +
    'h1{font-size:20pt}h2{font-size:14pt;margin-top:18pt;color:#7a2231}' +
    '.lbl{color:#555;font-size:10pt}p{margin:0 0 10pt}</style></head><body>' +
    bodyHtml + '</body></html>'
  )
}

function row(label, value) {
  if (!value || (Array.isArray(value) && !value.length)) return ''
  const v = Array.isArray(value) ? value.join(', ') : value
  return '<p><span class="lbl">' + esc(label) + ':</span> ' + esc(v) + '</p>'
}

function characterHtml(c) {
  let h = '<h2>' + esc(c.name || 'Sem nome') + (c.role ? ' — ' + esc(c.role) : '') + '</h2>'
  h += row('Nascimento', c.birthdate)
  h += row('Gênero', c.gender)
  h += row('Pronomes/tratamento', c.pronouns)
  h += row('Altura', c.height)
  h += row('Olhos', c.eyes)
  h += row('Pele', c.skin)
  h += row('Cabelo', c.hair)
  h += row('Porte', c.build)
  h += row('Seios', c.chest)
  h += row('Anatomia/marcas', c.anatomy)
  h += row('Perfume', c.scent)
  h += row('Voz', c.voice)
  h += row('Gesto', c.gesture)
  h += row('Estética', c.aesthetic)
  h += row('Dia a dia', c.lookEveryday)
  h += row('Festa/formal', c.lookFormal)
  h += row('Cores', c.colors)
  h += row('Residência', c.residence)
  h += row('Locomoção', c.transport)
  h += row('Ocupação', c.occupation)
  h += row('Objeto-marca', c.signatureObject)
  h += row('Qualidades', c.qualities)
  h += row('Defeitos/feridas', c.flaws)
  h += row('Desejo', c.desire)
  h += row('Medo', c.fear)
  h += row('Notas', c.notes)
  return h
}

function exportCharacterDoc(c) {
  const html = wrapDoc('Ficha — ' + (c.name || 'personagem'), '<h1>Ficha de personagem</h1>' + characterHtml(c))
  download('ficha-' + slug(c.name) + '.doc', new Blob([html], { type: 'application/msword' }))
}

function exportAllCharactersDoc(chars, projectTitle) {
  const body = '<h1>Dossiê de personagens — ' + esc(projectTitle) + '</h1>' + chars.map(characterHtml).join('<hr>')
  download('dossie-personagens-' + slug(projectTitle) + '.doc', new Blob([wrapDoc('Dossiê', body)], { type: 'application/msword' }))
}

function textToParas(t) {
  return (t || '')
    .split(/\n{2,}/)
    .map((p) => '<p>' + esc(p).replace(/\n/g, '<br>') + '</p>')
    .join('')
}

function exportChapterDoc(chapter, projectTitle) {
  const title = 'Capítulo ' + (chapter.number ?? '')
  const body = '<h1>' + esc(title) + '</h1>' + textToParas(chapter.text)
  download(slug(projectTitle) + '-cap-' + (chapter.number ?? 'x') + '.doc', new Blob([wrapDoc(title, body)], { type: 'application/msword' }))
}

// ---- Backup do projeto (JSON) ----
function exportProjectJSON(project) {
  const blob = new Blob([JSON.stringify(project, null, 2)], { type: 'application/json' })
  download('projeto-' + slug(project.title) + '.json', blob)
}

function readProjectJSON(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => {
      try {
        resolve(JSON.parse(r.result))
      } catch (e) {
        reject(new Error('Arquivo inválido.'))
      }
    }
    r.onerror = () => reject(new Error('Falha ao ler o arquivo.'))
    r.readAsText(file)
  })
}

// ===================== CharacterForm.jsx =====================

function Chips({ label, values, onChange, hint }) {
  const [draft, setDraft] = useState('')
  const add = () => {
    const v = draft.trim()
    if (v && !values.includes(v)) onChange([...values, v])
    setDraft('')
  }
  return (
    <div className="field">
      <label>{label}</label>
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), add())}
        placeholder={hint}
      />
      {values.length > 0 && (
        <div className="chips">
          {values.map((v) => (
            <span className="chip" key={v}>
              {v}
              <button type="button" onClick={() => onChange(values.filter((x) => x !== v))}>×</button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

function F({ label, value, onChange, placeholder, type = 'text' }) {
  return (
    <div className="field">
      <label>{label}</label>
      <input type={type} value={value || ''} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
    </div>
  )
}

function CharacterForm({ character, update, onSave, onDelete, canDelete, ageInfo }) {
  const c = character
  const set = (patch) => update(patch)

  return (
    <div className="char-form">
      <div className="form-head">
        <div>
          <input className="name-big" value={c.name} onChange={(e) => set({ name: e.target.value })} placeholder="Nome do personagem" />
          {ageInfo && <span className="age-pill">{ageInfo}</span>}
        </div>
        <button className="btn primary sm" onClick={onSave}>Salvar ficha</button>
      </div>

      <F label="Papel" value={c.role} onChange={(v) => set({ role: v })} placeholder="protagonista, antagonista…" />

      <p className="sheet-eyebrow">Identidade</p>
      <div className="grid2">
        <F label="Nascimento" type="date" value={c.birthdate} onChange={(v) => set({ birthdate: v })} />
        <F label="Gênero" value={c.gender} onChange={(v) => set({ gender: v })} placeholder="feminino / masculino / intersexo" />
      </div>
      <F label="Pronomes e tratamento" value={c.pronouns} onChange={(v) => set({ pronouns: v })} placeholder="ex.: sempre ela/dela, sem exceção" />

      <p className="sheet-eyebrow">Corpo</p>
      <div className="grid3">
        <F label="Altura" value={c.height} onChange={(v) => set({ height: v })} />
        <F label="Olhos" value={c.eyes} onChange={(v) => set({ eyes: v })} />
        <F label="Pele" value={c.skin} onChange={(v) => set({ skin: v })} />
        <F label="Cabelo" value={c.hair} onChange={(v) => set({ hair: v })} />
        <F label="Porte" value={c.build} onChange={(v) => set({ build: v })} />
        <F label="Seios" value={c.chest} onChange={(v) => set({ chest: v })} placeholder="sim/não/pequenos" />
      </div>
      <F label="Anatomia / marcas a travar" value={c.anatomy} onChange={(v) => set({ anatomy: v })} placeholder="ex.: intersexo (pênis); cicatriz no antebraço" />

      <p className="sheet-eyebrow">Assinatura sensorial</p>
      <F label="Perfume — a marca dele(a)" value={c.scent} onChange={(v) => set({ scent: v })} placeholder="ex.: couro, íris e fumo" />
      <div className="grid2">
        <F label="Voz" value={c.voice} onChange={(v) => set({ voice: v })} />
        <F label="Gesto característico" value={c.gesture} onChange={(v) => set({ gesture: v })} />
      </div>

      <p className="sheet-eyebrow">Estilo e figurino</p>
      <F label="Estética geral" value={c.aesthetic} onChange={(v) => set({ aesthetic: v })} placeholder="ex.: alfaiataria urbana" />
      <div className="grid2">
        <F label="Dia a dia" value={c.lookEveryday} onChange={(v) => set({ lookEveryday: v })} />
        <F label="Festa / formal" value={c.lookFormal} onChange={(v) => set({ lookFormal: v })} />
      </div>
      <F label="Cores e materiais" value={c.colors} onChange={(v) => set({ colors: v })} placeholder="vinho, preto, couro, seda" />

      <p className="sheet-eyebrow">Mundo dele(a)</p>
      <div className="grid2">
        <F label="Residência" value={c.residence} onChange={(v) => set({ residence: v })} />
        <F label="Locomoção" value={c.transport} onChange={(v) => set({ transport: v })} placeholder="carro/moto específico" />
        <F label="Ocupação" value={c.occupation} onChange={(v) => set({ occupation: v })} />
        <F label="Objeto-marca" value={c.signatureObject} onChange={(v) => set({ signatureObject: v })} />
      </div>

      <p className="sheet-eyebrow">Interior</p>
      <Chips label="Qualidades" values={c.qualities} onChange={(v) => set({ qualities: v })} hint="digite e Enter" />
      <Chips label="Defeitos / feridas" values={c.flaws} onChange={(v) => set({ flaws: v })} hint="digite e Enter" />
      <div className="grid2">
        <F label="Desejo (o que move)" value={c.desire} onChange={(v) => set({ desire: v })} />
        <F label="Medo (o que trava)" value={c.fear} onChange={(v) => set({ fear: v })} />
      </div>

      <div className="field">
        <label>Notas livres</label>
        <textarea value={c.notes || ''} onChange={(e) => set({ notes: e.target.value })} placeholder="qualquer coisa mais que precise ficar registrada" />
      </div>

      <div className="form-actions">
        <button className="btn primary" onClick={onSave}>Salvar ficha</button>
        <button className="btn subtle" onClick={() => exportCharacterDoc(c)}>Baixar em Word</button>
        {canDelete && <button className="btn danger" onClick={onDelete}>Excluir</button>}
      </div>
    </div>
  )
}

// ===================== CharactersTab.jsx =====================

function CharactersTab({ project, update, refDate }) {
  const p = project
  const [editingId, setEditingId] = useState(null)

  const setChar = (id, patch) =>
    update({ characters: p.characters.map((c) => (c.id === id ? { ...c, ...patch } : c)) })

  const addChar = () => {
    const c = newCharacter()
    update({ characters: [...p.characters, c] })
    setEditingId(c.id)
  }

  const delChar = (id) => {
    update({ characters: p.characters.filter((c) => c.id !== id) })
    setEditingId(null)
  }

  const ageOf = (c) => {
    if (!refDate || !c.birthdate) return null
    const a = computeAge(c.birthdate, refDate)
    return a != null ? `${a} anos` : null
  }

  const editing = p.characters.find((c) => c.id === editingId)

  return (
    <div className="char-tab">
      <aside className="char-list">
        <div className="char-list-head">
          <p className="eyebrow">Fichas salvas</p>
          <button className="ghost-btn sm" onClick={addChar}>+ novo</button>
        </div>
        {p.characters.length === 0 && <p className="hint">Nenhuma ficha ainda.</p>}
        {p.characters.map((c) => (
          <button
            key={c.id}
            className={'char-item' + (c.id === editingId ? ' active' : '')}
            onClick={() => setEditingId(c.id)}
          >
            <span className="ci-name">{c.name || 'Sem nome'}</span>
            <span className="ci-meta">
              {c.role || 'sem papel'}
              {ageOf(c) ? ' · ' + ageOf(c) : ''}
            </span>
          </button>
        ))}
        {p.characters.length > 0 && (
          <button className="ghost-btn sm full" onClick={() => exportAllCharactersDoc(p.characters, p.title)}>
            baixar dossiê (todas)
          </button>
        )}
      </aside>

      <section className="char-editor">
        {editing ? (
          <CharacterForm
            character={editing}
            update={(patch) => setChar(editing.id, patch)}
            onSave={() => setEditingId(null)}
            onDelete={() => delChar(editing.id)}
            canDelete={p.characters.length > 1}
            ageInfo={ageOf(editing)}
          />
        ) : (
          <div className="char-empty">
            <p>Selecione uma ficha à esquerda para editar,</p>
            <p>ou <button className="link-btn" onClick={addChar}>crie um novo personagem</button>.</p>
          </div>
        )}
      </section>
    </div>
  )
}

// ===================== SettingsTab.jsx =====================

function ChipInput({ label, hint, values, onChange }) {
  const [draft, setDraft] = useState('')
  const add = () => {
    const v = draft.trim()
    if (v && !values.includes(v)) onChange([...values, v])
    setDraft('')
  }
  return (
    <div className="field">
      <label>{label}</label>
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), add())}
        placeholder={hint}
      />
      {values.length > 0 && (
        <div className="chips">
          {values.map((v) => (
            <span className="chip" key={v}>
              {v}
              <button type="button" onClick={() => onChange(values.filter((x) => x !== v))}>×</button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

function Holidays({ holidays, update }) {
  const set = (id, patch) => update(holidays.map((h) => (h.id === id ? { ...h, ...patch } : h)))
  const add = () => update([...holidays, { id: uid(), name: '', day: 1, month: 1, scope: 'universal', city: '' }])
  const del = (id) => update(holidays.filter((h) => h.id !== id))
  return (
    <div>
      {holidays.map((h) => (
        <div className="holiday" key={h.id}>
          <div className="holiday-row">
            <input className="hol-name" value={h.name} onChange={(e) => set(h.id, { name: e.target.value })} placeholder="Nome da data" />
            <input className="hol-num" type="number" min="1" max="31" value={h.day} onChange={(e) => set(h.id, { day: +e.target.value })} />
            <input className="hol-num" type="number" min="1" max="12" value={h.month} onChange={(e) => set(h.id, { month: +e.target.value })} />
            <button className="chip-x" onClick={() => del(h.id)} aria-label="remover">×</button>
          </div>
          <div className="holiday-row2">
            <select value={h.scope} onChange={(e) => set(h.id, { scope: e.target.value })}>
              <option value="universal">universal</option>
              <option value="local">só na cidade</option>
            </select>
            {h.scope === 'local' && (
              <input value={h.city} onChange={(e) => set(h.id, { city: e.target.value })} placeholder="qual cidade" />
            )}
          </div>
        </div>
      ))}
      <button className="ghost-btn" onClick={add}>+ data comemorativa</button>
      <p className="hint">Dia · mês. Universais valem em qualquer cidade; locais só entram na cidade certa.</p>
    </div>
  )
}

function SettingsTab({ project, update, onImport }) {
  const p = project
  const fileRef = useRef(null)

  const handleFile = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const data = await readProjectJSON(file)
      onImport(data)
    } catch (err) {
      alert('Não consegui importar: ' + err.message)
    }
    e.target.value = ''
  }

  return (
    <div className="settings-tab">
      <div className="settings-col">
        <div className="section">
          <p className="eyebrow">História</p>
          <div className="field">
            <label>Título</label>
            <input value={p.title} onChange={(e) => update({ title: e.target.value })} placeholder="Nome da obra" />
          </div>
          <div className="field">
            <label>Premissa</label>
            <textarea value={p.logline} onChange={(e) => update({ logline: e.target.value })} placeholder="O coração da história em uma ou duas frases." />
          </div>
          <div className="field">
            <label>Cenário / atmosfera geral</label>
            <textarea value={p.setting} onChange={(e) => update({ setting: e.target.value })} placeholder="Cidade, lugares recorrentes, o clima físico e moral da obra." />
          </div>
        </div>

        <div className="section">
          <p className="eyebrow">Backup do projeto</p>
          <p className="hint" style={{ marginTop: 0, marginBottom: 10 }}>
            Seu seguro contra o navegador limpar os dados. Exporte de vez em quando; se perder algo, é só reimportar.
          </p>
          <div className="form-actions">
            <button className="btn subtle" onClick={() => exportProjectJSON(p)}>Exportar projeto</button>
            <button className="btn subtle" onClick={() => fileRef.current?.click()}>Importar projeto</button>
            <input ref={fileRef} type="file" accept="application/json,.json" style={{ display: 'none' }} onChange={handleFile} />
          </div>
        </div>
      </div>

      <div className="settings-col">
        <div className="section">
          <p className="eyebrow">Datas comemorativas</p>
          <Holidays holidays={p.holidays} update={(v) => update({ holidays: v })} />
        </div>

        <div className="section">
          <p className="eyebrow">Regras de estilo</p>
          <div className="field">
            <label>Diretrizes de escrita</label>
            <textarea style={{ minHeight: 120 }} value={p.styleGuide} onChange={(e) => update({ styleGuide: e.target.value })} />
          </div>
          <div className="field">
            <label>Cenas de intimidade e violência</label>
            <select value={p.sceneMode || 'full'} onChange={(e) => update({ sceneMode: e.target.value })}>
              <option value="full">Escrever por completo</option>
              <option value="placeholder">Deixar marcador para mim</option>
            </select>
          </div>
          <ChipInput label="Palavras proibidas" hint="digite e Enter — ex.: qualidade" values={p.bannedWords} onChange={(v) => update({ bannedWords: v })} />
          <ChipInput label="Nomes que não podem aparecer" hint="digite e Enter" values={p.forbiddenNames} onChange={(v) => update({ forbiddenNames: v })} />
          <div className="field">
            <label>Regras de pronome / tratamento</label>
            <textarea value={p.pronounRules} onChange={(e) => update({ pronounRules: e.target.value })} placeholder="ex.: personagem X sempre no feminino." />
          </div>
        </div>
      </div>
    </div>
  )
}

// ===================== Workspace.jsx =====================

const PLACEHOLDER = '\n\n[CENA ÍNTIMA — ESCREVER PELA AUTORA]\n\n'

const countWords = (t) => (t && t.trim() ? t.trim().split(/\s+/).length : 0)

function chapterDateLabel(ch) {
  if (!ch.startDate) return 'sem data'
  const a = formatDateBR(ch.startDate)
  if (ch.endDate && daysBetween(ch.startDate, ch.endDate) > 0) return `${a} → ${formatDateBR(ch.endDate)}`
  return a
}

function Workspace({ project, update, activeId, setActiveId, onGenerate, generating, status, onGenerateSummary, summarizing }) {
  const p = project
  const textRef = useRef(null)
  const [railOpen, setRailOpen] = useState(true)
  const chapter = p.chapters.find((c) => c.id === activeId) || p.chapters[0] || null
  const povNames = p.characters.map((c) => c.name).filter((n) => n && n.trim())

  const setChapter = (patch) =>
    update({ chapters: p.chapters.map((c) => (c.id === chapter.id ? { ...c, ...patch } : c)) })

  const sorted = p.chapters.slice().sort((a, b) => (a.number || 0) - (b.number || 0))

  const addChapter = () => {
    const nextNum = Math.max(0, ...p.chapters.map((c) => Number(c.number) || 0)) + 1
    const nc = newChapter(nextNum)
    nc.targetWords = chapter?.targetWords || 4000
    update({ chapters: [...p.chapters, nc] })
    setActiveId(nc.id)
  }

  const insertPlaceholder = () => {
    const el = textRef.current
    const text = chapter.text || ''
    if (!el) return setChapter({ text: text + PLACEHOLDER })
    const start = el.selectionStart ?? text.length
    const end = el.selectionEnd ?? text.length
    setChapter({ text: text.slice(0, start) + PLACEHOLDER + text.slice(end) })
    requestAnimationFrame(() => {
      el.focus()
      const pos = start + PLACEHOLDER.length
      el.setSelectionRange(pos, pos)
    })
  }

  if (!chapter) return <div className="workspace" />

  // ---- contexto temporal derivado do capítulo ativo ----
  const s = parseISO(chapter.startDate)
  const hemi = hemisphereOf(chapter.local, chapter.hemisphere)
  const seasonStart = s ? seasonOf(s.mo, hemi) : ''
  const e = parseISO(chapter.endDate)
  const seasonEnd = e ? seasonOf(e.mo, hemi) : seasonStart
  const dur = e ? daysBetween(chapter.startDate, chapter.endDate) : 0
  const clima = chapter.climateOverride?.trim() || climateHint(chapter.local, seasonStart)
  const hols = holidaysInRange(p.holidays, chapter.startDate, chapter.endDate, chapter.local)

  const idx = sorted.findIndex((c) => c.id === chapter.id)
  const prev = idx > 0 ? sorted[idx - 1] : null
  const prevEnd = prev ? prev.endDate || prev.startDate : null
  const gap = prevEnd && chapter.startDate ? daysBetween(prevEnd, chapter.startDate) : null

  // duração total da história
  const starts = sorted.map((c) => c.startDate).filter(Boolean)
  const ends = sorted.map((c) => c.endDate || c.startDate).filter(Boolean)
  let totalSpan = null
  if (starts.length && ends.length) {
    const min = starts.reduce((m, d) => (parseISO(d) && (!m || d < m) ? d : m), null)
    const max = ends.reduce((m, d) => (parseISO(d) && (!m || d > m) ? d : m), null)
    const dd = daysBetween(min, max)
    if (dd != null && dd >= 0) totalSpan = dd
  }

  return (
    <section className={'workspace two-col' + (railOpen ? '' : ' collapsed')}>
      <div className="ctrl-rail">
        <div className="timeline-strip">
          {sorted.map((c) => (
            <button
              key={c.id}
              className={'tl-chip' + (c.id === chapter.id ? ' active' : '') + (c.endDate && daysBetween(c.startDate, c.endDate) > 0 ? ' span' : '')}
              onClick={() => setActiveId(c.id)}
            >
              <span className="tl-cap">Cap. {c.number}</span>
              <span className="tl-date">{chapterDateLabel(c)}</span>
            </button>
          ))}
          <button className="tl-chip add" onClick={addChapter}>+ capítulo</button>
          {totalSpan != null && <span className="tl-span">cobre {totalSpan} dia(s)</span>}
        </div>

        <div className="time-card">
          <div className="grid-time">
            <div className="meta">
              <label>Início</label>
              <input type="date" value={chapter.startDate} onChange={(e) => setChapter({ startDate: e.target.value })} />
            </div>
            <div className="meta">
              <label>Fim (se durar dias)</label>
              <input type="date" value={chapter.endDate} onChange={(e) => setChapter({ endDate: e.target.value })} />
            </div>
            <div className="meta">
              <label>Hora do dia</label>
              <input value={chapter.timeOfDay} onChange={(e) => setChapter({ timeOfDay: e.target.value })} placeholder="fim de tarde" />
            </div>
            <div className="meta">
              <label>Local</label>
              <input value={chapter.local} onChange={(e) => setChapter({ local: e.target.value })} placeholder="Nova York" />
            </div>
            <div className="meta">
              <label>Hemisfério</label>
              <select value={chapter.hemisphere} onChange={(e) => setChapter({ hemisphere: e.target.value })}>
                <option value="auto">auto</option>
                <option value="norte">norte</option>
                <option value="sul">sul</option>
              </select>
            </div>
          </div>

          {s && (
            <div className="derived">
              {dur > 0 && <span className="d-pill accent">dura {dur} dia(s)</span>}
              {seasonStart && seasonEnd !== seasonStart ? (
                <span className="d-pill">{seasonStart} → {seasonEnd}</span>
              ) : (
                seasonStart && <span className="d-pill">{seasonStart}</span>
              )}
              {clima && <span className="d-pill">{clima}</span>}
              {hols.map((h) => (
                <span className="d-pill hol" key={h.id}>{h.name}</span>
              ))}
              {gap != null && gap !== 0 && <span className="d-pill muted">+{gap} dia(s) desde o anterior</span>}
              <input
                className="clima-input"
                value={chapter.climateOverride}
                onChange={(e) => setChapter({ climateOverride: e.target.value })}
                placeholder="ajustar clima (opcional)"
              />
            </div>
          )}
        </div>

        <div className="direction">
          <div className="meta">
            <label>Capítulo</label>
            <input className="num" type="number" value={chapter.number} onChange={(e) => setChapter({ number: e.target.value })} />
          </div>
          <div className="meta">
            <label>POV</label>
            <select className="pov" value={chapter.pov} onChange={(e) => setChapter({ pov: e.target.value })}>
              <option value="">— definir —</option>
              {povNames.map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <div className="meta">
            <label>Palavras-alvo</label>
            <input className="words" type="number" step="500" value={chapter.targetWords} onChange={(e) => setChapter({ targetWords: e.target.value })} />
          </div>
          <div className="prompt">
            <div className="meta">
              <label>Direção do capítulo</label>
              <textarea value={chapter.direction} onChange={(e) => setChapter({ direction: e.target.value })} placeholder="O que acontece aqui? Que tensão avança, que beat emocional, onde termina." />
            </div>
          </div>
        </div>

        <div className="chapter-summary">
          <label>Resumo do capítulo <span className="lbl-note">— memória longa; entra no prompt dos próximos capítulos</span></label>
          <textarea
            value={chapter.summary}
            onChange={(e) => setChapter({ summary: e.target.value })}
            placeholder="2-3 linhas do que aconteceu de relevante. Escreva você ou clique em gerar."
          />
          <button
            className="btn subtle sm"
            onClick={() => onGenerateSummary(chapter)}
            disabled={summarizing || !chapter.text?.trim()}
          >
            {summarizing ? 'Resumindo…' : 'Gerar resumo do capítulo'}
          </button>
        </div>

        <div className="actions">
          <button className="btn primary" onClick={() => onGenerate(chapter)} disabled={generating}>
            {generating ? 'Escrevendo…' : 'Gerar rascunho'}
          </button>
          <button className="btn subtle" onClick={insertPlaceholder}>+ marcador de cena íntima</button>
          <button className="btn subtle" onClick={() => exportChapterDoc(chapter, p.title)} disabled={!chapter.text?.trim()}>
            Baixar capítulo em Word
          </button>
          {status && <span className={'status' + (status.type === 'error' ? ' error' : '')}>{status.msg}</span>}
        </div>
      </div>

      <div className="manuscript-col">
        <div className="manuscript-bar">
          <button className="collapse-btn" onClick={() => setRailOpen(!railOpen)} title={railOpen ? 'Recolher controles' : 'Mostrar controles'}>
            {railOpen ? '⟨ ocultar controles' : 'mostrar controles ⟩'}
          </button>
          <span className="ms-chapter">Cap. {chapter.number}{chapter.pov ? ' · ' + chapter.pov : ''}</span>
          <span className="spacer" />
          <span className="ms-count">{countWords(chapter.text)} palavras</span>
        </div>
        <textarea
          className="page-area"
          ref={textRef}
          value={chapter.text}
          onChange={(e) => setChapter({ text: e.target.value })}
          placeholder="A página está em branco. Preencha a direção e gere um rascunho — ou comece você mesma."
        />
      </div>
    </section>
  )
}

// ===================== App.jsx =====================

const MODEL_SUGGESTIONS = [
  'cognitivecomputations/dolphin-mistral-24b-venice-edition',
  'cognitivecomputations/dolphin-mistral-24b-venice-edition:free',
  'cognitivecomputations/dolphin-llama-3-70b',
  'thedrummer/cydonia-24b-v4.1',
  'meta-llama/llama-3.3-70b-instruct',
]

async function callModel({ model, system, user, temperature, max_tokens }) {
  const res = await fetch('/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, system, user, temperature, max_tokens }),
  })
  let data
  try {
    data = await res.json()
  } catch {
    throw new Error(`O servidor respondeu de forma inesperada (HTTP ${res.status}).`)
  }
  if (!res.ok || data?.error) {
    const detail = data?.detail?.error?.message || data?.error || 'erro desconhecido'
    throw new Error(`O modelo recusou ou falhou: ${detail}. Dica: cheque se o slug do modelo existe, se há crédito, ou se o limite do modelo :free do dia acabou.`)
  }
  const text = (data.text || '').trim()
  if (!text) throw new Error('O modelo devolveu texto vazio. Tente de novo ou troque de modelo.')
  return text
}

function App() {
  const [state, setState] = useState(() => {
    const saved = loadState()
    if (saved && saved.projects?.length) {
      return { ...saved, projects: saved.projects.map(normalizeProject) }
    }
    const p = newProject('Projeto sem título')
    return { projects: [p], currentId: p.id }
  })
  const [tab, setTab] = useState('personagens')
  const [activeChapterId, setActiveChapterId] = useState(null)
  const [generating, setGenerating] = useState(false)
  const [summarizing, setSummarizing] = useState(false)
  const [status, setStatus] = useState(null)

  useEffect(() => {
    saveState(state)
  }, [state])

  const project = useMemo(
    () => state.projects.find((p) => p.id === state.currentId) || state.projects[0],
    [state],
  )

  const update = (patch) =>
    setState((s) => ({
      ...s,
      projects: s.projects.map((p) => (p.id === project.id ? { ...p, ...patch } : p)),
    }))

  const newProj = () => {
    const p = newProject('Projeto sem título')
    setState((s) => ({ projects: [...s.projects, p], currentId: p.id }))
    setActiveChapterId(null)
    setStatus(null)
  }

  const deleteProj = () => {
    if (state.projects.length <= 1) return
    if (!confirm(`Excluir "${project.title}"? Não dá pra desfazer.`)) return
    setState((s) => {
      const rest = s.projects.filter((p) => p.id !== project.id)
      return { projects: rest, currentId: rest[0].id }
    })
    setActiveChapterId(null)
  }

  const onImportProject = (data) => {
    const p = normalizeProject(data)
    if (state.projects.some((x) => x.id === p.id)) p.id = uid()
    setState((s) => ({ projects: [...s.projects, p], currentId: p.id }))
    setStatus({ type: 'info', msg: 'Projeto importado.' })
  }

  const activeChapter =
    project.chapters.find((c) => c.id === activeChapterId) || project.chapters[0] || {}

  async function onGenerate(chapter) {
    setGenerating(true)
    setStatus({ type: 'info', msg: 'Enviando para o modelo…' })
    try {
      const sorted = project.chapters.slice().sort((a, b) => (a.number || 0) - (b.number || 0))
      const idx = sorted.findIndex((c) => c.id === chapter.id)
      const prev = idx > 0 ? sorted[idx - 1] : null
      const priorChapters = idx > 0 ? sorted.slice(0, idx) : []

      const system = buildSystemPrompt(project)
      const user = buildUserPrompt({ project, chapter, prevChapter: prev, priorChapters })

      const draft = await callModel({ model: project.model, system, user, temperature: 0.9, max_tokens: 6000 })

      setState((s) => ({
        ...s,
        projects: s.projects.map((p) => {
          if (p.id !== project.id) return p
          return {
            ...p,
            chapters: p.chapters.map((c) => {
              if (c.id !== chapter.id) return c
              const joined = c.text?.trim() ? c.text.trimEnd() + '\n\n———\n\n' + draft : draft
              return { ...c, text: joined }
            }),
          }
        }),
      }))
      setStatus({ type: 'info', msg: 'Rascunho pronto.' })
    } catch (err) {
      setStatus({ type: 'error', msg: String(err.message || err) })
    } finally {
      setGenerating(false)
    }
  }

  async function onGenerateSummary(chapter) {
    if (!chapter.text?.trim()) return
    setSummarizing(true)
    setStatus({ type: 'info', msg: 'Resumindo o capítulo…' })
    try {
      const summary = await callModel({
        model: project.model,
        system: '',
        user: buildSummaryPrompt(chapter.text),
        temperature: 0.3,
        max_tokens: 400,
      })
      setState((s) => ({
        ...s,
        projects: s.projects.map((p) =>
          p.id !== project.id
            ? p
            : { ...p, chapters: p.chapters.map((c) => (c.id === chapter.id ? { ...c, summary } : c)) },
        ),
      }))
      setStatus({ type: 'info', msg: 'Resumo pronto.' })
    } catch (err) {
      setStatus({ type: 'error', msg: String(err.message || err) })
    } finally {
      setSummarizing(false)
    }
  }

  return (
    <div className="app">
      <header className="topbar">
        <div className="wordmark">
          <span className="dot" />
          Escrivaninha
        </div>

        <nav className="tabs">
          <button className={'tab-btn' + (tab === 'personagens' ? ' active' : '')} onClick={() => setTab('personagens')}>Personagens</button>
          <button className={'tab-btn' + (tab === 'manuscrito' ? ' active' : '')} onClick={() => setTab('manuscrito')}>Manuscrito</button>
          <button className={'tab-btn' + (tab === 'historia' ? ' active' : '')} onClick={() => setTab('historia')}>História</button>
        </nav>

        <div className="spacer" />

        <select
          className="top-select"
          value={project.id}
          onChange={(e) => {
            setState((s) => ({ ...s, currentId: e.target.value }))
            setActiveChapterId(null)
            setStatus(null)
          }}
        >
          {state.projects.map((p) => (
            <option key={p.id} value={p.id}>{p.title || 'sem título'}</option>
          ))}
        </select>
        <button className="top-btn" onClick={newProj}>+ projeto</button>
        {state.projects.length > 1 && <button className="top-btn" onClick={deleteProj}>excluir</button>}

        <span className="model-label" style={{ marginLeft: 8 }}>modelo</span>
        <input
          className="top-select"
          style={{ width: 230 }}
          list="model-list"
          value={project.model}
          onChange={(e) => update({ model: e.target.value })}
          placeholder="slug do modelo na OpenRouter"
        />
        <datalist id="model-list">
          {MODEL_SUGGESTIONS.map((m) => <option key={m} value={m} />)}
        </datalist>
      </header>

      <div className="main-single">
        {tab === 'personagens' && (
          <CharactersTab project={project} update={update} refDate={activeChapter.startDate} />
        )}
        {tab === 'manuscrito' && (
          <Workspace
            project={project}
            update={update}
            activeId={activeChapterId}
            setActiveId={setActiveChapterId}
            onGenerate={onGenerate}
            generating={generating}
            status={status}
            onGenerateSummary={onGenerateSummary}
            summarizing={summarizing}
          />
        )}
        {tab === 'historia' && (
          <SettingsTab project={project} update={update} onImport={onImportProject} />
        )}
      </div>
    </div>
  )
}

// ===================== render =====================
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
