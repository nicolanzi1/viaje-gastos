'use client'
import { useMemo } from 'react'
import { useExpenses } from '@/contexts/ExpensesContext'
import { fmt, formatDate, dueStatus, dueLabel } from '@/hooks/useCalc'
import { useCalc } from '@/hooks/useCalc'

export default function TabVencimientos() {
  const { expenses } = useExpenses()
  const { personName } = useCalc()

  const withDates = useMemo(() => expenses.filter(e => e.dueDate), [expenses])

  const overdue  = useMemo(() => withDates.filter(e => dueStatus(e) === 'overdue').sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime()), [withDates])
  const soon     = useMemo(() => withDates.filter(e => dueStatus(e) === 'soon').sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime()), [withDates])
  const upcoming = useMemo(() => withDates.filter(e => dueStatus(e) === 'upcoming' && e.status !== 'pagado').sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime()), [withDates])
  const paid     = useMemo(() => expenses.filter(e => e.status === 'pagado' && e.dueDate).sort((a, b) => new Date(b.dueDate!).getTime() - new Date(a.dueDate!).getTime()), [expenses])

  function DueList({ items, rowCls }: { items: typeof overdue; rowCls: string }) {
    if (items.length === 0) return <div className="text-muted text-sm">Sin pagos.</div>
    return (
      <div className="due-list">
        {items.map(exp => (
          <div key={exp.id} className={`due-item ${rowCls}`}>
            <div className="due-date">{formatDate(exp.dueDate)}</div>
            <div className="due-name">{exp.name}<div className="text-muted text-sm">{personName(exp.paidBy)}</div></div>
            <div className="due-amt">{fmt(exp.amount)}</div>
            <span className={`due-badge ${dueLabel(exp).cls}`}>{dueLabel(exp).text}</span>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div>
      <div className="section-title-lg">Calendario de Pagos</div>
      <div className="dash-grid">
        <div>
          <div className="card mb-16">
            <div className="card-header"><span className="card-title">Vencidos</span></div>
            <div className="card-body"><DueList items={overdue} rowCls="due-overdue" /></div>
          </div>
          <div className="card">
            <div className="card-header"><span className="card-title">Proximos 30 dias</span></div>
            <div className="card-body"><DueList items={soon} rowCls="due-soon" /></div>
          </div>
        </div>
        <div>
          <div className="card mb-16">
            <div className="card-header"><span className="card-title">Futuros</span></div>
            <div className="card-body"><DueList items={upcoming} rowCls="due-upcoming" /></div>
          </div>
          <div className="card">
            <div className="card-header"><span className="card-title">Pagados</span></div>
            <div className="card-body">
              {paid.length === 0 ? <div className="text-muted text-sm">Sin pagos completados.</div> : (
                <div className="due-list">
                  {paid.map(exp => (
                    <div key={exp.id} className="due-item due-paid">
                      <div className="due-date">{formatDate(exp.dueDate)}</div>
                      <div className="due-name">{exp.name}<div className="text-muted text-sm">{personName(exp.paidBy)}</div></div>
                      <div className="due-amt">{fmt(exp.amount)}</div>
                      <span className="due-badge due-badge-paid">Pagado</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
