import { useEffect, useMemo, useState } from 'react'
import BiblePanel from './BiblePanel.jsx'
import Workspace from './Workspace.jsx'
import { loadState, saveState, newProject } from './store.js'
import { buildSystemPrompt, buildUserPrompt, tailOf } from './prompt.js'

const MODEL_SUGGESTIONS = [
  'cognitivecomputations/dolphin-mistral-24b-venice-edition',
  'cognitivecomputations/dolphin-mistral-24b-venice-edition:free',
  'cognitivecomputations/dolphin-llama-3-70b',
  'thedrummer/cydonia-24b-v4.1',
  'meta-llama/llama-3.3-70b-instruct',
]

export default function App() {
  const [state, setState] = useState(() => {
    const saved = loadState()
    if (saved && saved.projects?.length) return saved
    const p = newProject('Projeto sem título')
    return { projects: [p], currentId: p.id }
  })
  const [activeChapterId, setActiveChapterId] = useState(null)
  const [generating, setGenerating] = useState(false)
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
      projects: s.projects.map((p) =>
        p.id === project.id ? { ...p, ...patch } : p,
      ),
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

  async function onGenerate(chapter) {
    setGenerating(true)
    setStatus({ type: 'info', msg: 'Enviando para o modelo…' })
    try {
      const chaptersSorted = project.chapters
        .slice()
        .sort((a, b) => (a.number || 0) - (b.number || 0))
      const idx = chaptersSorted.findIndex((c) => c.id === chapter.id)
      const prev = idx > 0 ? chaptersSorted[idx - 1] : null

      const system = buildSystemPrompt(project)
      const user = buildUserPrompt({
        chapterNumber: chapter.number,
        pov: chapter.pov,
        targetWords: chapter.targetWords,
        direction: chapter.direction,
        prevTail: prev ? tailOf(prev.text) : '',
      })

      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: project.model,
          system,
          user,
          temperature: 0.9,
          max_tokens: 6000,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Falha na geração.')

      const draft = (data.text || '').trim()
      if (!draft) throw new Error('O modelo devolveu texto vazio.')

      setState((s) => ({
        ...s,
        projects: s.projects.map((p) => {
          if (p.id !== project.id) return p
          return {
            ...p,
            chapters: p.chapters.map((c) => {
              if (c.id !== chapter.id) return c
              const joined = c.text?.trim()
                ? c.text.trimEnd() + '\n\n———\n\n' + draft
                : draft
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

  return (
    <div className="app">
      <header className="topbar">
        <div className="wordmark">
          <span className="dot" />
          Escrivaninha
          <small>bible &amp; manuscrito</small>
        </div>

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
            <option key={p.id} value={p.id}>
              {p.title || 'sem título'}
            </option>
          ))}
        </select>
        <button className="top-btn" onClick={newProj}>
          + projeto
        </button>
        {state.projects.length > 1 && (
          <button className="top-btn" onClick={deleteProj}>
            excluir
          </button>
        )}

        <span className="model-label" style={{ marginLeft: 8 }}>
          modelo
        </span>
        <input
          className="top-select"
          style={{ width: 240 }}
          list="model-list"
          value={project.model}
          onChange={(e) => update({ model: e.target.value })}
          placeholder="slug do modelo na OpenRouter"
        />
        <datalist id="model-list">
          {MODEL_SUGGESTIONS.map((m) => (
            <option key={m} value={m} />
          ))}
        </datalist>
      </header>

      <div className="main">
        <BiblePanel project={project} update={update} />
        <Workspace
          project={project}
          update={update}
          activeId={activeChapterId}
          setActiveId={setActiveChapterId}
          onGenerate={onGenerate}
          generating={generating}
          status={status}
        />
      </div>
    </div>
  )
}
