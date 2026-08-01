import { useEffect, useMemo, useState } from 'react'
import CharactersTab from './CharactersTab.jsx'
import Workspace from './Workspace.jsx'
import SettingsTab from './SettingsTab.jsx'
import { loadState, saveState, newProject, normalizeProject, uid } from './store.js'
import { buildSystemPrompt, buildUserPrompt, buildSummaryPrompt } from './prompt.js'

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

export default function App() {
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
