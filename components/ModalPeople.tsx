'use client'
import { useState, useEffect } from 'react'
import { useExpenses } from '@/contexts/ExpensesContext'
import { avatarInitial } from '@/hooks/useCalc'
import type { Person } from '@/lib/types'

interface Props {
  open: boolean
  onClose: () => void
}

function PersonRow({ person, onRename }: { person: Person; onRename: (name: string) => void }) {
  const [name, setName] = useState(person.name)

  useEffect(() => { setName(person.name) }, [person.name])

  return (
    <div className="person-manage-row">
      <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: person.color }}></div>
      <div className="person-avatar" style={{ background: person.color, width: '28px', height: '28px', fontSize: '12px' }}>
        {avatarInitial(person.name)}
      </div>
      <input
        type="text"
        value={name}
        style={{ flex: 1, padding: '5px 8px', fontSize: '13px' }}
        onChange={e => setName(e.target.value)}
        onBlur={() => onRename(name)}
      />
    </div>
  )
}

export default function ModalPeople({ open, onClose }: Props) {
  const { people, renamePerson } = useExpenses()

  function onBackdropClick(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) onClose()
  }

  return (
    <div className={`modal-backdrop${open ? ' open' : ''}`} onClick={onBackdropClick}>
      <div className="modal" style={{ maxWidth: '420px' }}>
        <div className="modal-header">
          <div className="modal-title">Gestionar Parejas</div>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="alert alert-info mb-16">Las 3 parejas del viaje.</div>
          <div>
            {people.map(p => (
              <PersonRow key={p.id} person={p} onRename={name => renamePerson(p.id, name)} />
            ))}
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-primary" onClick={onClose}>Hecho</button>
        </div>
      </div>
    </div>
  )
}
