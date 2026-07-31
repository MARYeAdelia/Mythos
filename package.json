// Transforma a bible + regras de estilo num system prompt que enquadra o trabalho
// como ficção literária adulta e injeta continuidade e restrições automaticamente.

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
  if (p.logline && p.logline.trim()) L.push(`Premissa: ${p.logline.trim()}`)
  L.push('')

  if (chars.length) {
    L.push('PERSONAGENS (respeite integralmente — nomes, papéis e traços):')
    for (const c of chars) {
      const head = c.role ? `${c.name} (${c.role})` : c.name
      L.push(`- ${head}: ${c.description || ''}`.trimEnd())
    }
    L.push('')
  }
  if (p.setting && p.setting.trim()) {
    L.push('CENÁRIO / GEOGRAFIA:')
    L.push(p.setting.trim())
    L.push('')
  }
  if (p.calendar && p.calendar.trim()) {
    L.push('CALENDÁRIO NARRATIVO:')
    L.push(p.calendar.trim())
    L.push('')
  }

  L.push('REGRAS DE ESTILO (obrigatórias):')
  if (p.styleGuide && p.styleGuide.trim()) L.push(p.styleGuide.trim())
  if (banned.length)
    L.push(
      `- Palavras PROIBIDAS, nunca use em nenhuma flexão ou derivação: ${banned.join(', ')}.`,
    )
  if (forbidden.length)
    L.push(`- Nomes que NÃO podem aparecer no texto: ${forbidden.join(', ')}.`)
  if (p.pronounRules && p.pronounRules.trim())
    L.push(`- Regras de pronome e tratamento: ${p.pronounRules.trim()}`)
  L.push('')

  if (p.sceneMode === 'placeholder') {
    L.push(
      'CENAS ÍNTIMAS EXPLÍCITAS: não escreva conteúdo sexual explícito. Onde uma cena ' +
        'assim aconteceria, deixe exatamente o marcador [CENA ÍNTIMA — ESCREVER PELA AUTORA] ' +
        'em uma linha só dele e retome a narrativa depois. A autora escreve essas passagens.',
    )
  } else {
    L.push(
      'INTENSIDADE: escreva cada cena por completo — seja de intimidade explícita, de ' +
        'violência ou de agressão — com a mesma corporeidade e o mesmo peso emocional do ' +
        'resto do capítulo. Nada de cortes, "fade to black", eufemismo pudico ou marcadores: ' +
        'a cena vai até onde a narrativa pedir. Mantenha o cuidado literário — ritmo, ' +
        'subtexto, causa e consequência — em vez de gratuidade.',
    )
  }
  L.push(
    'Entregue apenas a prosa do capítulo: sem títulos, sem notas, sem meta-comentário ' +
      'e sem resumir a própria cena.',
  )
  return L.join('\n')
}

export function buildUserPrompt({ chapterNumber, pov, targetWords, direction, prevTail }) {
  const L = []
  if (prevTail && prevTail.trim()) {
    L.push(
      'FINAL DO CAPÍTULO ANTERIOR (só para continuidade — não repita, continue a partir do clima):',
    )
    L.push('"""')
    L.push(prevTail.trim())
    L.push('"""')
    L.push('')
  }
  const povTxt = pov ? `, em POV de ${pov}` : ''
  L.push(`Escreva o Capítulo ${chapterNumber ?? ''}${povTxt}.`)
  if (targetWords) L.push(`Extensão-alvo: cerca de ${targetWords} palavras.`)
  L.push('')
  L.push('Direção do capítulo:')
  L.push(
    direction && direction.trim()
      ? direction.trim()
      : '(sem direção específica — desenvolva a cena a partir da bible e do clima estabelecido)',
  )
  return L.join('\n')
}

// Pega as últimas ~180 palavras de um texto para dar continuidade sem estourar contexto.
export function tailOf(text, words = 180) {
  if (!text) return ''
  const arr = text.trim().split(/\s+/)
  return arr.length <= words ? text.trim() : arr.slice(-words).join(' ')
}
