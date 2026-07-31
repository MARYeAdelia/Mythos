const KEY = 'escrivaninha.v2'

export function uid() {
  return Math.random().toString(36).slice(2, 10)
}

export function loadState() {
  try {
    const raw = localStorage.getItem(KEY) || localStorage.getItem('escrivaninha.v1')
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function saveState(state) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
  } catch {
    /* ignora */
  }
}

export function newCharacter() {
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

export function newChapter(number = 1) {
  return {
    id: uid(),
    number,
    pov: '',
    targetWords: 4000,
    direction: '',
    text: '',
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

export function newProject(title = 'Novo projeto') {
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
export function normalizeProject(p) {
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
