import { useState } from 'react'

function Chips({ label, values, onChange, hint }) {
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
              <button type="button" onClick={() => onChange(values.filter((x) => x !== v))}>
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

function F({ label, value, onChange, placeholder, type = 'text' }) {
  return (
    <div className="field">
      <label>{label}</label>
      <input type={type} value={value || ''} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
    </div>
  )
}

export default function CharacterCard({ character, update, onDelete, canDelete, ageInfo }) {
  const c = character
  const [open, setOpen] = useState(true)
  const set = (patch) => update(patch)

  return (
    <div className="char">
      <div className="char-head">
        <button className="char-toggle" onClick={() => setOpen(!open)} aria-label="abrir/fechar ficha">
          <span className={'chev' + (open ? ' open' : '')}>›</span>
          <span className="char-name">{c.name || 'Sem nome'}</span>
          {c.role && <span className="char-role">{c.role}</span>}
        </button>
        {ageInfo && <span className="age-pill">{ageInfo}</span>}
      </div>

      {open && (
        <div className="char-body">
          <div className="grid2">
            <F label="Nome" value={c.name} onChange={(v) => set({ name: v })} placeholder="Nome" />
            <F label="Papel" value={c.role} onChange={(v) => set({ role: v })} placeholder="protagonista…" />
          </div>

          <p className="sheet-eyebrow">Identidade</p>
          <div className="grid2">
            <F label="Nascimento" type="date" value={c.birthdate} onChange={(v) => set({ birthdate: v })} />
            <F label="Gênero" value={c.gender} onChange={(v) => set({ gender: v })} placeholder="feminino / masculino / intersexo" />
          </div>
          <F label="Pronomes e tratamento" value={c.pronouns} onChange={(v) => set({ pronouns: v })} placeholder="ex.: sempre ela/dela, sem exceção" />

          <p className="sheet-eyebrow">Corpo</p>
          <div className="grid3">
            <F label="Altura" value={c.height} onChange={(v) => set({ height: v })} />
            <F label="Olhos" value={c.eyes} onChange={(v) => set({ eyes: v })} />
            <F label="Pele" value={c.skin} onChange={(v) => set({ skin: v })} />
            <F label="Cabelo" value={c.hair} onChange={(v) => set({ hair: v })} />
            <F label="Porte" value={c.build} onChange={(v) => set({ build: v })} />
            <F label="Seios" value={c.chest} onChange={(v) => set({ chest: v })} placeholder="sim/não/pequenos" />
          </div>
          <F label="Anatomia / marcas a travar" value={c.anatomy} onChange={(v) => set({ anatomy: v })} placeholder="ex.: intersexo (pênis); cicatriz no antebraço" />

          <p className="sheet-eyebrow">Assinatura sensorial</p>
          <F label="Perfume — a marca dele(a)" value={c.scent} onChange={(v) => set({ scent: v })} placeholder="ex.: couro, íris e fumo" />
          <div className="grid2">
            <F label="Voz" value={c.voice} onChange={(v) => set({ voice: v })} />
            <F label="Gesto característico" value={c.gesture} onChange={(v) => set({ gesture: v })} />
          </div>

          <p className="sheet-eyebrow">Estilo e figurino</p>
          <F label="Estética geral" value={c.aesthetic} onChange={(v) => set({ aesthetic: v })} placeholder="ex.: alfaiataria urbana" />
          <div className="grid2">
            <F label="Dia a dia" value={c.lookEveryday} onChange={(v) => set({ lookEveryday: v })} />
            <F label="Festa / formal" value={c.lookFormal} onChange={(v) => set({ lookFormal: v })} />
          </div>
          <F label="Cores e materiais" value={c.colors} onChange={(v) => set({ colors: v })} placeholder="vinho, preto, couro, seda" />

          <p className="sheet-eyebrow">Mundo dele(a)</p>
          <div className="grid2">
            <F label="Residência" value={c.residence} onChange={(v) => set({ residence: v })} />
            <F label="Locomoção" value={c.transport} onChange={(v) => set({ transport: v })} placeholder="carro/moto específico" />
            <F label="Ocupação" value={c.occupation} onChange={(v) => set({ occupation: v })} />
            <F label="Objeto-marca" value={c.signatureObject} onChange={(v) => set({ signatureObject: v })} />
          </div>

          <p className="sheet-eyebrow">Interior</p>
          <Chips label="Qualidades" values={c.qualities} onChange={(v) => set({ qualities: v })} hint="digite e Enter" />
          <Chips label="Defeitos / feridas" values={c.flaws} onChange={(v) => set({ flaws: v })} hint="digite e Enter" />
          <div className="grid2">
            <F label="Desejo (o que move)" value={c.desire} onChange={(v) => set({ desire: v })} />
            <F label="Medo (o que trava)" value={c.fear} onChange={(v) => set({ fear: v })} />
          </div>

          <div className="field">
            <label>Notas livres</label>
            <textarea value={c.notes || ''} onChange={(e) => set({ notes: e.target.value })} placeholder="qualquer coisa mais que precise ficar registrada" />
          </div>

          {canDelete && (
            <button className="char-del" onClick={onDelete}>
              remover personagem
            </button>
          )}
        </div>
      )}
    </div>
  )
}
