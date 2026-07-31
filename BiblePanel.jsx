import { useState } from 'react'
import { uid } from './store.js'
import { newCharacter } from './store.js'
import CharacterCard from './CharacterCard.jsx'
import { computeAge } from './datetime.js'

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
      <p className="hint">Formato: dia · mês. As universais valem em qualquer cidade; as locais só entram quando o capítulo se passa na cidade certa.</p>
    </div>
  )
}

export default function BiblePanel({ project, update, refDate }) {
  const p = project

  const setChar = (id, patch) =>
    update({ characters: p.characters.map((c) => (c.id === id ? { ...c, ...patch } : c)) })
  const addChar = () => update({ characters: [...p.characters, newCharacter()] })
  const delChar = (id) => update({ characters: p.characters.filter((c) => c.id !== id) })

  const ageOf = (c) => {
    if (!refDate || !c.birthdate) return null
    const a = computeAge(c.birthdate, refDate)
    return a != null ? `${a} anos` : null
  }

  return (
    <aside className="bible">
      <div className="section">
        <p className="eyebrow">Projeto</p>
        <div className="field">
          <label>Título</label>
          <input value={p.title} onChange={(e) => update({ title: e.target.value })} placeholder="Nome da obra" />
        </div>
        <div className="field">
          <label>Premissa</label>
          <textarea value={p.logline} onChange={(e) => update({ logline: e.target.value })} placeholder="O coração da história em uma ou duas frases." />
        </div>
      </div>

      <div className="section">
        <p className="eyebrow">Personagens</p>
        {p.characters.map((c) => (
          <CharacterCard
            key={c.id}
            character={c}
            update={(patch) => setChar(c.id, patch)}
            onDelete={() => delChar(c.id)}
            canDelete={p.characters.length > 1}
            ageInfo={ageOf(c)}
          />
        ))}
        <button className="ghost-btn" onClick={addChar}>+ personagem</button>
      </div>

      <div className="section">
        <p className="eyebrow">Mundo</p>
        <div className="field">
          <label>Cenário / atmosfera geral</label>
          <textarea value={p.setting} onChange={(e) => update({ setting: e.target.value })} placeholder="Cidade, lugares recorrentes, o clima físico e moral da obra." />
        </div>
      </div>

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
    </aside>
  )
}
