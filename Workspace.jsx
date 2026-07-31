import { useRef } from 'react'
import { uid } from './store.js'

const PLACEHOLDER = '\n\n[CENA ÍNTIMA — ESCREVER PELA AUTORA]\n\n'

function countWords(t) {
  if (!t || !t.trim()) return 0
  return t.trim().split(/\s+/).length
}

export default function Workspace({
  project,
  update,
  activeId,
  setActiveId,
  onGenerate,
  generating,
  status,
}) {
  const p = project
  const textRef = useRef(null)

  const chapter =
    p.chapters.find((c) => c.id === activeId) || p.chapters[0] || null

  const povNames = p.characters.map((c) => c.name).filter((n) => n && n.trim())

  const setChapter = (patch) =>
    update({
      chapters: p.chapters.map((c) =>
        c.id === chapter.id ? { ...c, ...patch } : c,
      ),
    })

  const addChapter = () => {
    const nextNum =
      Math.max(0, ...p.chapters.map((c) => Number(c.number) || 0)) + 1
    const nc = {
      id: uid(),
      number: nextNum,
      pov: '',
      targetWords: chapter?.targetWords || 4000,
      direction: '',
      text: '',
    }
    update({ chapters: [...p.chapters, nc] })
    setActiveId(nc.id)
  }

  const insertPlaceholder = () => {
    const el = textRef.current
    const text = chapter.text || ''
    if (!el) {
      setChapter({ text: text + PLACEHOLDER })
      return
    }
    const start = el.selectionStart ?? text.length
    const end = el.selectionEnd ?? text.length
    const next = text.slice(0, start) + PLACEHOLDER + text.slice(end)
    setChapter({ text: next })
    requestAnimationFrame(() => {
      el.focus()
      const pos = start + PLACEHOLDER.length
      el.setSelectionRange(pos, pos)
    })
  }

  if (!chapter) return <div className="workspace" />

  return (
    <section className="workspace">
      <div className="desk">
        <div className="chapter-tabs">
          {p.chapters
            .slice()
            .sort((a, b) => (a.number || 0) - (b.number || 0))
            .map((c) => (
              <button
                key={c.id}
                className={'tab' + (c.id === chapter.id ? ' active' : '')}
                onClick={() => setActiveId(c.id)}
              >
                Cap. {c.number}
              </button>
            ))}
          <button className="tab add" onClick={addChapter}>
            + capítulo
          </button>
        </div>

        <div className="direction">
          <div className="meta">
            <label>Capítulo</label>
            <input
              className="num"
              type="number"
              value={chapter.number}
              onChange={(e) => setChapter({ number: e.target.value })}
            />
          </div>
          <div className="meta">
            <label>POV</label>
            <select
              className="pov"
              value={chapter.pov}
              onChange={(e) => setChapter({ pov: e.target.value })}
            >
              <option value="">— definir —</option>
              {povNames.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
          <div className="meta">
            <label>Palavras-alvo</label>
            <input
              className="words"
              type="number"
              step="500"
              value={chapter.targetWords}
              onChange={(e) => setChapter({ targetWords: e.target.value })}
            />
          </div>
          <div className="prompt">
            <div className="meta">
              <label>Direção do capítulo</label>
              <textarea
                value={chapter.direction}
                onChange={(e) => setChapter({ direction: e.target.value })}
                placeholder="O que acontece aqui? Que tensão avança, que beat emocional, onde termina."
              />
            </div>
          </div>
        </div>

        <div className="actions">
          <button
            className="btn primary"
            onClick={() => onGenerate(chapter)}
            disabled={generating}
          >
            {generating ? 'Escrevendo…' : 'Gerar rascunho'}
          </button>
          <button className="btn subtle" onClick={insertPlaceholder}>
            + marcador de cena íntima
          </button>
          {status && (
            <span className={'status' + (status.type === 'error' ? ' error' : '')}>
              {status.msg}
            </span>
          )}
        </div>
      </div>

      <div className="page-wrap">
        <div className="page">
          <textarea
            ref={textRef}
            value={chapter.text}
            onChange={(e) => setChapter({ text: e.target.value })}
            placeholder="A página está em branco. Escreva a direção acima e gere um rascunho — ou comece você mesma. O texto vem pra cá, e é seu para reescrever."
          />
          <div className="counter">{countWords(chapter.text)} palavras</div>
        </div>
      </div>
    </section>
  )
}
