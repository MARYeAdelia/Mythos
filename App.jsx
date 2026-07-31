import { useState } from 'react'
import { uid } from '../lib/store.js'

function ChipInput({ label, hint, values, onChange, tone = 'garnet' }) {
  const [draft, setDraft] = useState('')
  const add = () => {
    const v = draft.trim()
    if (!v) return
    if (!values.includes(v)) onChange([...values, v])
    setDraft('')
  }
  return (
    <div className="field">
      <label>{label}</label>
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            add()
          }
        }}
        placeholder={hint}
      />
      {values.length > 0 && (
        <div className="chips">
          {values.map((v) => (
            <span className="chip" key={v}>
              {v}
              <button
                type="button"
                aria-label={`remover ${v}`}
                onClick={() => onChange(values.filter((x) => x !== v))}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

export default function BiblePanel({ project, update }) {
  const p = project

  const setChar = (id, patch) =>
    update({
      characters: p.characters.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    })

  const addChar = () =>
    update({
      characters: [...p.characters, { id: uid(), name: '', role: '', description: '' }],
    })

  const delChar = (id) =>
    update({ characters: p.characters.filter((c) => c.id !== id) })

  return (
    <aside className="bible">
      <div className="section">
        <p className="eyebrow">Projeto</p>
        <div className="field">
          <label>Título</label>
          <input
            value={p.title}
            onChange={(e) => update({ title: e.target.value })}
            placeholder="Nome da obra"
          />
        </div>
        <div className="field">
          <label>Premissa</label>
          <textarea
            value={p.logline}
            onChange={(e) => update({ logline: e.target.value })}
            placeholder="Uma ou duas frases sobre o coração da história."
          />
        </div>
      </div>

      <div className="section">
        <p className="eyebrow">Personagens</p>
        {p.characters.map((c) => (
          <div className="char" key={c.id}>
            <div className="row">
              <input
                value={c.name}
                onChange={(e) => setChar(c.id, { name: e.target.value })}
                placeholder="Nome"
              />
              <input
                value={c.role}
                onChange={(e) => setChar(c.id, { role: e.target.value })}
                placeholder="Papel"
              />
            </div>
            <textarea
              value={c.description}
              onChange={(e) => setChar(c.id, { description: e.target.value })}
              placeholder="Traços, voz, corpo, o que a move, o que a trava."
            />
            {p.characters.length > 1 && (
              <button className="char-del" onClick={() => delChar(c.id)}>
                remover
              </button>
            )}
          </div>
        ))}
        <button className="ghost-btn" onClick={addChar}>
          + personagem
        </button>
      </div>

      <div className="section">
        <p className="eyebrow">Mundo</p>
        <div className="field">
          <label>Cenário / geografia</label>
          <textarea
            value={p.setting}
            onChange={(e) => update({ setting: e.target.value })}
            placeholder="Cidade, lugares recorrentes, atmosfera física."
          />
        </div>
        <div className="field">
          <label>Calendário narrativo</label>
          <textarea
            value={p.calendar}
            onChange={(e) => update({ calendar: e.target.value })}
            placeholder="Linha do tempo — o que aconteceu quando, para não furar continuidade."
          />
        </div>
      </div>

      <div className="section">
        <p className="eyebrow">Regras de estilo</p>
        <div className="field">
          <label>Diretrizes de escrita</label>
          <textarea
            style={{ minHeight: 120 }}
            value={p.styleGuide}
            onChange={(e) => update({ styleGuide: e.target.value })}
          />
        </div>
        <div className="field">
          <label>Cenas de intimidade e violência</label>
          <select
            value={p.sceneMode || 'full'}
            onChange={(e) => update({ sceneMode: e.target.value })}
          >
            <option value="full">Escrever por completo</option>
            <option value="placeholder">Deixar marcador para mim</option>
          </select>
        </div>
        <ChipInput
          label="Palavras proibidas"
          hint="digite e Enter — ex.: qualidade"
          values={p.bannedWords}
          onChange={(v) => update({ bannedWords: v })}
        />
        <ChipInput
          label="Nomes que não podem aparecer"
          hint="digite e Enter"
          values={p.forbiddenNames}
          onChange={(v) => update({ forbiddenNames: v })}
        />
        <div className="field">
          <label>Regras de pronome / tratamento</label>
          <textarea
            value={p.pronounRules}
            onChange={(e) => update({ pronounRules: e.target.value })}
            placeholder="Ex.: personagem X sempre no feminino; depois do 'você' em privado, não volta ao 'a senhora'."
          />
        </div>
      </div>
    </aside>
  )
}
