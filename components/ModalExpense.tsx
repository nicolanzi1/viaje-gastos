'use client'
import { useEffect, useState } from 'react'
import { useExpenses, uid } from '@/contexts/ExpensesContext'
import { SECTIONS } from '@/lib/types'
import type { Expense, Status } from '@/lib/types'

const CATEGORIES = ['vuelos', 'hoteles', 'airbnb', 'comida', 'transporte', 'actividades', 'otro']

interface Props {
  open: boolean
  expenseId?: string | null
  onClose: () => void
}

interface FormState {
  name: string
  category: string
  amount: string | number
  paidBy: string
  status: Status
  dueDate: string
  notes: string
  sections: number[]
  people: string[]
}

const blankForm: FormState = {
  name: '', category: '', amount: '', paidBy: '',
  status: 'sin pagar', dueDate: '', notes: '', sections: [], people: []
}

export default function ModalExpense({ open, expenseId, onClose }: Props) {
  const { expenses, people, saveExpense } = useExpenses()
  const [form, setForm] = useState<FormState>(blankForm)

  const isEditing = !!expenseId
  const dueDateLabel = form.status === 'pagado' ? 'Fecha en que se pagó' : 'Fecha de vencimiento'

  useEffect(() => {
    if (!open) return
    const exp = expenseId ? expenses.find(e => e.id === expenseId) : null
    if (exp) {
      setForm({
        name: exp.name, category: exp.category, amount: exp.amount,
        paidBy: exp.paidBy, status: exp.status, dueDate: exp.dueDate || '',
        notes: exp.notes, sections: [...exp.sections], people: [...exp.people]
      })
    } else {
      setForm({ ...blankForm, people: people.map(p => p.id) })
    }
  }, [open, expenseId]) // eslint-disable-line react-hooks/exhaustive-deps

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  function toggleSection(id: number) {
    set('sections', form.sections.includes(id) ? form.sections.filter(s => s !== id) : [...form.sections, id])
  }

  function togglePerson(id: string) {
    set('people', form.people.includes(id) ? form.people.filter(p => p !== id) : [...form.people, id])
  }

  async function save() {
    if (!form.name.trim()) { alert('Introduce un nombre.'); return }
    if (!form.category) { alert('Selecciona una categoria.'); return }
    const amt = parseFloat(String(form.amount))
    if (!amt || amt <= 0) { alert('Introduce un importe valido.'); return }
    if (!form.paidBy) { alert('Selecciona quien pagó.'); return }
    if (form.sections.length === 0) { alert('Selecciona al menos un destino.'); return }
    if (form.people.length === 0) { alert('Selecciona al menos una pareja.'); return }

    const exp: Expense = {
      id: expenseId || uid(),
      name: form.name.trim(), category: form.category, amount: amt,
      paidBy: form.paidBy, status: form.status, dueDate: form.dueDate || null,
      notes: form.notes.trim(), sections: [...form.sections], people: [...form.people]
    }
    await saveExpense(exp)
    onClose()
  }

  function onBackdropClick(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) onClose()
  }

  return (
    <div className={`modal-backdrop${open ? ' open' : ''}`} onClick={onBackdropClick}>
      <div className="modal">
        <div className="modal-header">
          <div className="modal-title">{isEditing ? 'Editar Gasto' : 'Añadir Gasto'}</div>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="form-grid">
            <div className="field form-full">
              <label className="field-label">Nombre *</label>
              <input type="text" value={form.name} onChange={e => set('name', e.target.value)} placeholder="Ej. Hotel Madrid" />
            </div>

            <div className="field">
              <label className="field-label">Categoria *</label>
              <select value={form.category} onChange={e => set('category', e.target.value)}>
                <option value="">Seleccionar</option>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>

            <div className="field">
              <label className="field-label">Importe total *</label>
              <input type="number" value={form.amount} onChange={e => set('amount', e.target.value)} placeholder="0.00" min="0" step="0.01" />
            </div>

            <div className="field">
              <label className="field-label">Pagado por *</label>
              <select value={form.paidBy} onChange={e => set('paidBy', e.target.value)}>
                <option value="">Seleccionar</option>
                {people.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>

            <div className="field">
              <label className="field-label">Estado</label>
              <select value={form.status} onChange={e => set('status', e.target.value as Status)}>
                <option value="pagado">Pagado</option>
                <option value="pendiente-fecha">Pendiente con fecha</option>
                <option value="sin pagar">Sin pagar</option>
              </select>
            </div>

            <div className="field">
              <label className="field-label">{dueDateLabel}</label>
              <input type="date" value={form.dueDate} onChange={e => set('dueDate', e.target.value)} />
            </div>

            <div className="field form-full">
              <label className="field-label">Destino(s) *</label>
              <div className="checkbox-group">
                {SECTIONS.map(s => (
                  <label
                    key={s.id}
                    className={`checkbox-pill${form.sections.includes(s.id) ? ' checked' : ''}`}
                    onClick={e => { e.preventDefault(); toggleSection(s.id) }}
                  >
                    <span className="pip"></span>{s.name}
                  </label>
                ))}
              </div>
            </div>

            <div className="field form-full">
              <label className="field-label">Parejas incluidas *</label>
              <div className="checkbox-group">
                {people.map(p => (
                  <label
                    key={p.id}
                    className={`checkbox-pill${form.people.includes(p.id) ? ' checked' : ''}`}
                    onClick={e => { e.preventDefault(); togglePerson(p.id) }}
                  >
                    <span className="pip" style={{ background: p.color }}></span>{p.name}
                  </label>
                ))}
              </div>
            </div>

            <div className="field form-full">
              <label className="field-label">Notas</label>
              <input type="text" value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Nota opcional" />
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn btn-amber" onClick={save}>Guardar</button>
        </div>
      </div>
    </div>
  )
}
