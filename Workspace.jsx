import { useRef } from 'react'
import { newChapter } from './store.js'
import {
  formatDateBR,
  hemisphereOf,
  seasonOf,
  climateHint,
  holidaysInRange,
  daysBetween,
  parseISO,
} from './datetime.js'

const PLACEHOLDER = '\n\n[CENA ÍNTIMA — ESCREVER PELA AUTORA]\n\n'

const countWords = (t) => (t && t.trim() ? t.trim().split(/\s+/).length : 0)

function chapterDateLabel(ch) {
  if (!ch.startDate) return 'sem data'
  const a = formatDateBR(ch.startDate)
  if (ch.endDate && daysBetween(ch.startDate, ch.endDate) > 0) return `${a} → ${formatDateBR(ch.endDate)}`
  return a
}

export default function Workspace({ project, update, activeId, setActiveId, onGenerate, generating, status }) {
  const p = project
  const textRef = useRef(null)
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
    <section className="workspace">
      <div className="desk">
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

        <div className="actions">
          <button className="btn primary" onClick={() => onGenerate(chapter)} disabled={generating}>
            {generating ? 'Escrevendo…' : 'Gerar rascunho'}
          </button>
          <button className="btn subtle" onClick={insertPlaceholder}>+ marcador de cena íntima</button>
          {status && <span className={'status' + (status.type === 'error' ? ' error' : '')}>{status.msg}</span>}
        </div>
      </div>

      <div className="page-wrap">
        <div className="page">
          <textarea
            ref={textRef}
            value={chapter.text}
            onChange={(e) => setChapter({ text: e.target.value })}
            placeholder="A página está em branco. Preencha a direção e gere um rascunho — ou comece você mesma."
          />
          <div className="counter">{countWords(chapter.text)} palavras</div>
        </div>
      </div>
    </section>
  )
}
