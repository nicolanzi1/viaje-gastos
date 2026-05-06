'use client'
import { useMemo, useState } from 'react'
import { useExpenses } from '@/contexts/ExpensesContext'
import { fmt, formatDate, sectionName, calcSplits, dueLabel, avatarInitial, statusBadge } from '@/hooks/useCalc'
import { useCalc } from '@/hooks/useCalc'
import { SECTIONS } from '@/lib/types'

const CATEGORIES = ['vuelos', 'hoteles', 'airbnb', 'comida', 'transporte', 'actividades', 'otro']

interface Props {
  onOpenExpense: (id: string) => void
}

export default function TabExpenses({ onOpenExpense }: Props) {
  const { expenses, people, deleteExpense } = useExpenses()
  const { personName, personColor } = useCalc()

  const [filterSection, setFilterSection] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterPerson, setFilterPerson] = useState('')

  const filteredExpenses = useMemo(() =>
    expenses.filter(e => {
      if (filterSection !== '' && !(e.sections || []).includes(Number(filterSection))) return false
      if (filterCategory !== '' && e.category !== filterCategory) return false
      if (filterStatus !== '' && e.status !== filterStatus) return false
      if (filterPerson !== '' && !(e.people || []).includes(filterPerson)) return false
      return true
    }),
    [expenses, filterSection, filterCategory, filterStatus, filterPerson]
  )

  function clearFilters() {
    setFilterSection('')
    setFilterCategory('')
    setFilterStatus('')
    setFilterPerson('')
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar este gasto?')) return
    await deleteExpense(id)
  }

  return (
    <div className="card mb-16">
      <div className="filter-bar">
        <label>Filtrar:</label>
        <select value={filterSection} onChange={e => setFilterSection(e.target.value)}>
          <option value="">Todos los destinos</option>
          {SECTIONS.map(s => <option key={s.id} value={String(s.id)}>{s.name}</option>)}
        </select>
        <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
          <option value="">Todas las categorias</option>
          {CATEGORIES.map(c => <option key={c}>{c}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="">Todos los estados</option>
          <option value="pagado">Pagado</option>
          <option value="pendiente-fecha">Pendiente con fecha</option>
          <option value="sin pagar">Sin pagar</option>
        </select>
        <select value={filterPerson} onChange={e => setFilterPerson(e.target.value)}>
          <option value="">Todas las parejas</option>
          {people.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <button className="btn btn-ghost btn-sm" onClick={clearFilters}>Limpiar</button>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Gasto</th><th>Categoria</th><th>Destino</th><th>Importe</th>
              <th>Pagado por</th><th>Estado</th><th>Fecha</th><th>Parejas</th><th></th>
            </tr>
          </thead>
          <tbody>
            {filteredExpenses.length === 0 ? (
              <tr>
                <td colSpan={9}>
                  <div className="empty-state">
                    <div className="empty-state-icon">✈</div>
                    <div className="empty-state-title">Sin gastos</div>
                  </div>
                </td>
              </tr>
            ) : filteredExpenses.map(exp => (
              <tr key={exp.id}>
                <td>
                  <strong>{exp.name}</strong>
                  {exp.notes && <div className="text-muted text-sm">{exp.notes}</div>}
                </td>
                <td><span className={`badge badge-${exp.category || 'otro'}`}>{exp.category || 'otro'}</span></td>
                <td>{sectionName(exp.sections || [])}</td>
                <td className="text-mono">
                  <strong>{fmt(exp.amount)}</strong>
                  {Object.entries(calcSplits(exp)).map(([pid, share]) => (
                    <div key={pid} style={{ fontSize: '11px', color: 'var(--ink3)' }}>
                      {personName(pid)}: {fmt(share)}
                    </div>
                  ))}
                </td>
                <td>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '20px', height: '20px', borderRadius: '50%', color: 'white', fontSize: '10px', fontWeight: 600, background: personColor(exp.paidBy) }}>
                      {avatarInitial(personName(exp.paidBy))}
                    </span>
                    {personName(exp.paidBy)}
                  </span>
                </td>
                <td><span className={`badge ${statusBadge(exp.status).cls}`}>{statusBadge(exp.status).text}</span></td>
                <td>
                  {exp.dueDate ? (
                    <>
                      {formatDate(exp.dueDate)}
                      <span className={`due-badge ${dueLabel(exp).cls}`}>{dueLabel(exp).text}</span>
                    </>
                  ) : '-'}
                </td>
                <td>
                  {(exp.people || []).map(pid => (
                    <span
                      key={pid}
                      title={personName(pid)}
                      style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '22px', height: '22px', borderRadius: '50%', color: 'white', fontSize: '10px', fontWeight: 600, marginRight: '2px', background: personColor(pid) }}
                    >{avatarInitial(personName(pid))}</span>
                  ))}
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button className="btn btn-ghost btn-icon btn-sm" onClick={() => onOpenExpense(exp.id)}>✏</button>
                    <button className="btn btn-danger btn-icon btn-sm" onClick={() => handleDelete(exp.id)}>🗑</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
