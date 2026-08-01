import { useState } from 'react'
import { newCharacter } from './store.js'
import CharacterForm from './CharacterForm.jsx'
import { computeAge } from './datetime.js'
import { exportAllCharactersDoc } from './exporters.js'

export default function CharactersTab({ project, update, refDate }) {
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
