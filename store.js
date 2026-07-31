const KEY = 'escrivaninha.v1'

export function uid() {
  return Math.random().toString(36).slice(2, 10)
}

export function loadState() {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function saveState(state) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
  } catch {
    /* quota cheia ou modo privado — ignora */
  }
}

// Projeto novo já vem com padrões de estilo alinhados a prosa densa e literária.
// Tudo é editável — são só um ponto de partida.
export function newProject(title = 'Novo projeto') {
  return {
    id: uid(),
    title,
    logline: '',
    characters: [{ id: uid(), name: '', role: '', description: '' }],
    setting: '',
    calendar: '',
    styleGuide:
      '- Capítulos longos e densos.\n' +
      '- Diálogo com peso e subtexto; o que não é dito importa tanto quanto o que é.\n' +
      '- Corporeidade detalhada: postura, respiração, olhar, tensão na mandíbula, mãos.\n' +
      '- Emoção construída devagar, sem atalhos nem resumo emocional.\n' +
      '- Cenas imersivas, nunca narração expositiva.',
    bannedWords: ['qualidade'],
    forbiddenNames: [],
    pronounRules: '',
    sceneMode: 'full', // 'full' = escreve tudo | 'placeholder' = deixa marcador
    model: 'thedrummer/cydonia-24b-v4.1',
    chapters: [
      { id: uid(), number: 1, pov: '', targetWords: 4000, direction: '', text: '' },
    ],
    currentChapterId: null,
  }
}
