'use client'
import { useExpenses } from '@/contexts/ExpensesContext'
import { useCalc, fmt, fmtSigned, avatarInitial, calcSplits } from '@/hooks/useCalc'

export default function TabSplits() {
  const { expenses, people } = useExpenses()
  const { personName, personColor, calcBalances, calcSettlements, totalTrip } = useCalc()

  function balanceLabel(id: string) {
    const bal = calcBalances.balances[id] || 0
    if (bal > 0.01) return { cls: 'owes-negative', text: 'Le deben ' + fmt(bal) }
    if (bal < -0.01) return { cls: 'owes-positive', text: 'Debe ' + fmt(-bal) }
    return { cls: 'owes-zero', text: 'Todo liquidado' }
  }

  return (
    <div>
      <div className="dash-grid">
        <div>
          <div className="section-title-lg">Saldos</div>
          <div className="gap-12">
            {people.map(p => (
              <div key={p.id} className="card">
                <div className="card-body" style={{ padding: '14px 16px' }}>
                  <div className="person-name-row" style={{ marginBottom: '10px' }}>
                    <div className="person-avatar" style={{ background: p.color }}>{avatarInitial(p.name)}</div>
                    <div>
                      <div className="person-name">{p.name}</div>
                      <div className={`person-owes mt-4 ${balanceLabel(p.id).cls}`} style={{ marginTop: '4px' }}>{balanceLabel(p.id).text}</div>
                    </div>
                  </div>
                  <div className="person-stat-row">
                    <span>Total pagado</span>
                    <span className="person-stat-val">{fmt(calcBalances.paid[p.id] || 0)}</span>
                  </div>
                  <div className="person-stat-row">
                    <span>Parte a pagar</span>
                    <span className="person-stat-val">{fmt(calcBalances.owed[p.id] || 0)}</span>
                  </div>
                  <div className="person-stat-row">
                    <span>Saldo neto</span>
                    <span className="person-stat-val" style={{ color: (calcBalances.balances[p.id] || 0) >= 0 ? 'var(--teal)' : 'var(--rose)' }}>
                      {fmtSigned(calcBalances.balances[p.id] || 0)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="section-title-lg">Liquidaciones</div>
          <div className="alert alert-info">Transferencias minimas para saldar todas las deudas.</div>
          <div className="settlement-list">
            {calcSettlements.length === 0
              ? <div className="text-muted text-sm" style={{ padding: '16px 0' }}>Todo liquidado!</div>
              : calcSettlements.map(s => (
                <div key={s.from + s.to} className="settlement-item">
                  <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '26px', height: '26px', borderRadius: '50%', color: 'white', fontSize: '11px', fontWeight: 600, background: personColor(s.from) }}>
                    {avatarInitial(personName(s.from))}
                  </span>
                  <strong>{personName(s.from)}</strong>
                  <span className="settlement-arrow">→</span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '26px', height: '26px', borderRadius: '50%', color: 'white', fontSize: '11px', fontWeight: 600, background: personColor(s.to) }}>
                    {avatarInitial(personName(s.to))}
                  </span>
                  <strong>{personName(s.to)}</strong>
                  <span className="settlement-amt">{fmt(s.amount)}</span>
                </div>
              ))
            }
          </div>
        </div>
      </div>

      <div className="mt-16">
        <div className="section-title-lg">Detalle por Gasto</div>
        {expenses.length === 0
          ? <div className="text-muted text-sm">Sin gastos.</div>
          : <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Gasto</th><th>Total</th><th>Pagado por</th>
                    {people.map(p => <th key={p.id}>{p.name}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {expenses.map(exp => (
                    <tr key={exp.id}>
                      <td><strong>{exp.name}</strong></td>
                      <td className="text-mono">{fmt(exp.amount)}</td>
                      <td>{personName(exp.paidBy)}</td>
                      {people.map(p => (
                        <td key={p.id} className="text-mono text-sm">
                          {calcSplits(exp)[p.id] !== undefined ? fmt(calcSplits(exp)[p.id]) : '-'}
                        </td>
                      ))}
                    </tr>
                  ))}
                  <tr style={{ background: 'var(--cream)', fontWeight: 600 }}>
                    <td>TOTAL</td>
                    <td className="text-mono">{fmt(totalTrip)}</td>
                    <td></td>
                    {people.map(p => <td key={p.id} className="text-mono">{fmt(calcBalances.owed[p.id] || 0)}</td>)}
                  </tr>
                </tbody>
              </table>
            </div>
        }
      </div>
    </div>
  )
}
