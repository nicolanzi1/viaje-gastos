'use client'
import { useMemo } from 'react'
import { useExpenses } from '@/contexts/ExpensesContext'
import { useCalc, fmt, formatDate, avatarInitial, dueLabel, dueCls } from '@/hooks/useCalc'
import { SECTIONS, CAT_COLORS } from '@/lib/types'

interface Props {
  onOpenExpense: (id: string) => void
}

export default function TabDashboard({ onOpenExpense: _onOpenExpense }: Props) {
  const { expenses, people } = useExpenses()
  const { totalTrip, statusTotals, bySectionData, byCategoryData, calcBalances } = useCalc()

  const maxSection = Math.max(...Object.values(bySectionData), 1)
  const sortedCats = Object.entries(byCategoryData).sort((a, b) => b[1] - a[1])
  const maxCat = Math.max(...Object.values(byCategoryData), 1)

  const upcomingDues = useMemo(() =>
    expenses
      .filter(e => e.dueDate)
      .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
      .slice(0, 5),
    [expenses]
  )

  const paidPct = totalTrip > 0 ? (statusTotals['pagado'] / totalTrip) * 100 : 0
  const pendingPct = totalTrip > 0 ? (statusTotals['pendiente-fecha'] / totalTrip) * 100 : 0
  const unpaidPct = totalTrip > 0 ? (statusTotals['sin pagar'] / totalTrip) * 100 : 0

  function balanceLabel(id: string) {
    const bal = calcBalances.balances[id] || 0
    if (bal > 0.01) return { cls: 'owes-negative', text: 'Le deben ' + fmt(bal) }
    if (bal < -0.01) return { cls: 'owes-positive', text: 'Debe ' + fmt(-bal) }
    return { cls: 'owes-zero', text: 'Liquidado' }
  }

  return (
    <div>
      <div className="summary-grid">
        <div className="stat-card accent-amber">
          <div className="stat-label">Total Viaje</div>
          <div className="stat-value">{fmt(totalTrip)}</div>
          <div className="stat-sub">{expenses.length} gastos</div>
        </div>
        <div className="stat-card accent-teal">
          <div className="stat-label">Pagado</div>
          <div className="stat-value">{fmt(statusTotals['pagado'])}</div>
          <div className="progress-bar-wrap">
            <div className="progress-bar-fill fill-teal" style={{ width: paidPct + '%' }}></div>
          </div>
        </div>
        <div className="stat-card accent-orange">
          <div className="stat-label">Pendiente</div>
          <div className="stat-value">{fmt(statusTotals['pendiente-fecha'])}</div>
        </div>
        <div className="stat-card accent-rose">
          <div className="stat-label">Sin Pagar</div>
          <div className="stat-value">{fmt(statusTotals['sin pagar'])}</div>
        </div>
        <div className="stat-card accent-blue">
          <div className="stat-label">Media por Pareja</div>
          <div className="stat-value">{people.length > 0 ? fmt(totalTrip / people.length) : 'EUR 0.00'}</div>
          <div className="stat-sub">{people.length} parejas</div>
        </div>
      </div>

      <div className="dash-grid mt-8">
        <div className="card">
          <div className="card-header"><span className="card-title">Por Destino</span></div>
          <div className="card-body">
            <div className="section-bars">
              {SECTIONS.map(s => (
                <div key={s.id} className="section-bar-item">
                  <div className="section-bar-label">{s.name}</div>
                  <div className="section-bar-track">
                    <div className="section-bar-fill" style={{ width: (bySectionData[s.id] / maxSection * 100) + '%', background: s.color }}></div>
                  </div>
                  <div className="section-bar-amt">{fmt(bySectionData[s.id])}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header"><span className="card-title">Por Categoria</span></div>
          <div className="card-body">
            {sortedCats.length === 0
              ? <div className="text-muted text-sm">Sin gastos.</div>
              : sortedCats.map(([cat, amt]) => (
                <div key={cat} className="cat-row">
                  <div className="cat-dot" style={{ background: CAT_COLORS[cat] || '#aaa' }}></div>
                  <div className="cat-name">{cat}</div>
                  <div style={{ flex: 1, margin: '0 10px' }}>
                    <div className="progress-bar-wrap" style={{ height: '6px' }}>
                      <div className="progress-bar-fill" style={{ width: (amt / maxCat * 100) + '%', background: CAT_COLORS[cat] || '#aaa' }}></div>
                    </div>
                  </div>
                  <div className="cat-amt">{fmt(amt)}</div>
                </div>
              ))
            }
          </div>
        </div>
      </div>

      <div className="mt-16">
        <div className="section-title-lg">Por Pareja</div>
        <div className="people-grid">
          {people.map(p => (
            <div key={p.id} className="person-card">
              <div className="person-name-row">
                <div className="person-avatar" style={{ background: p.color }}>{avatarInitial(p.name)}</div>
                <div className="person-name">{p.name}</div>
              </div>
              <div className="person-stat-row">
                <span>Ha pagado</span>
                <span className="person-stat-val">{fmt(calcBalances.paid[p.id] || 0)}</span>
              </div>
              <div className="person-stat-row">
                <span>Su parte</span>
                <span className="person-stat-val">{fmt(calcBalances.owed[p.id] || 0)}</span>
              </div>
              <div className={`person-owes ${balanceLabel(p.id).cls}`}>{balanceLabel(p.id).text}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="card mt-16">
        <div className="card-header"><span className="card-title">Proximos Pagos</span></div>
        <div className="card-body">
          {upcomingDues.length === 0
            ? <div className="text-muted text-sm">No hay vencimientos.</div>
            : <div className="due-list">
                {upcomingDues.map(exp => (
                  <div key={exp.id} className={`due-item due-${dueCls(exp)}`}>
                    <div className="due-date">{formatDate(exp.dueDate)}</div>
                    <div className="due-name">{exp.name}</div>
                    <div className="due-amt">{fmt(exp.amount)}</div>
                    <span className={`due-badge ${dueLabel(exp).cls}`}>{dueLabel(exp).text}</span>
                  </div>
                ))}
              </div>
          }
        </div>
      </div>

      <div className="card mt-16">
        <div className="card-header"><span className="card-title">Estado de Pagos</span></div>
        <div className="card-body">
          {[
            { label: 'Pagado',              amt: statusTotals['pagado'],           cls: 'fill-teal',   pct: paidPct },
            { label: 'Pendiente con fecha', amt: statusTotals['pendiente-fecha'],  cls: 'fill-orange', pct: pendingPct },
            { label: 'Sin pagar',           amt: statusTotals['sin pagar'],        cls: 'fill-rose',   pct: unpaidPct }
          ].map(g => (
            <div key={g.label} style={{ marginBottom: '14px' }}>
              <div className="row-between" style={{ marginBottom: '6px' }}>
                <span className="text-sm">{g.label}</span>
                <span className="text-mono text-sm">{fmt(g.amt)} ({g.pct.toFixed(0)}%)</span>
              </div>
              <div className="progress-bar-wrap" style={{ height: '10px' }}>
                <div className={`progress-bar-fill ${g.cls}`} style={{ width: g.pct + '%' }}></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
