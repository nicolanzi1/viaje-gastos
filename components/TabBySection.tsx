'use client'
import { useExpenses } from '@/contexts/ExpensesContext'
import { fmt, statusBadge } from '@/hooks/useCalc'
import { useCalc } from '@/hooks/useCalc'
import { SECTIONS } from '@/lib/types'

export default function TabBySection() {
  const { expenses } = useExpenses()
  const { personName } = useCalc()

  return (
    <div className="gap-12">
      {SECTIONS.map(sec => {
        const sectionExpenses = expenses.filter(e => (e.sections || []).includes(sec.id))
        const total = sectionExpenses.reduce((s, e) => s + (e.amount || 0), 0)
        return (
          <div key={sec.id} className="card">
            <div className="card-header" style={{ borderLeft: '4px solid ' + sec.color, paddingLeft: '16px' }}>
              <div>
                <div className="card-title">{sec.name}</div>
                <div className="text-muted text-sm">{sec.dates}</div>
              </div>
              <div className="text-mono" style={{ fontSize: '20px', fontWeight: 500 }}>{fmt(total)}</div>
            </div>
            <div className="card-body">
              {sectionExpenses.length === 0
                ? <div className="text-muted text-sm">Sin gastos.</div>
                : <div className="table-wrap">
                    <table>
                      <thead>
                        <tr><th>Gasto</th><th>Importe</th><th>Pagado por</th><th>Estado</th></tr>
                      </thead>
                      <tbody>
                        {sectionExpenses.map(exp => (
                          <tr key={exp.id}>
                            <td><strong>{exp.name}</strong></td>
                            <td className="text-mono">{fmt(exp.amount)}</td>
                            <td>{personName(exp.paidBy)}</td>
                            <td><span className={`badge ${statusBadge(exp.status).cls}`}>{statusBadge(exp.status).text}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
              }
            </div>
          </div>
        )
      })}
    </div>
  )
}
