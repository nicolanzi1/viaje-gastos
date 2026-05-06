import { useMemo } from 'react'
import { useExpenses } from '@/contexts/ExpensesContext'
import { SECTIONS } from '@/lib/types'
import type { Expense } from '@/lib/types'

export const fmt = (n: number) => 'EUR ' + Math.abs(Number(n) || 0).toFixed(2)

export const fmtSigned = (n: number) => {
  n = Number(n) || 0
  return (n >= 0 ? '+ ' : '- ') + 'EUR ' + Math.abs(n).toFixed(2)
}

export const formatDate = (str?: string | null) => {
  if (!str) return '-'
  const d = new Date(str + 'T00:00:00')
  return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
}

export const sectionName = (sections: number[]) => {
  if (!sections || sections.length === 0) return '-'
  if (sections.length > 1) return 'Varios'
  return SECTIONS[sections[0]]?.name || '-'
}

export const avatarInitial = (name: string) => (name ? name[0].toUpperCase() : '?')

export function calcSplits(exp: Expense): Record<string, number> {
  if (!exp.people || exp.people.length === 0) return {}
  const share = exp.amount / exp.people.length
  return Object.fromEntries(exp.people.map(pid => [pid, share]))
}

export function dueStatus(exp: Expense): 'paid' | 'overdue' | 'soon' | 'upcoming' {
  if (exp.status === 'pagado') return 'paid'
  if (!exp.dueDate) return 'upcoming'
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const d = new Date(exp.dueDate + 'T00:00:00')
  const diff = Math.ceil((d.getTime() - today.getTime()) / 86400000)
  if (diff < 0) return 'overdue'
  if (diff <= 30) return 'soon'
  return 'upcoming'
}

export function dueLabel(exp: Expense) {
  if (exp.status === 'pagado') return { cls: 'due-badge-paid', text: 'Pagado' }
  const s = dueStatus(exp)
  if (s === 'overdue') return { cls: 'due-badge-overdue', text: 'Vencido' }
  if (s === 'soon') {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const d = new Date(exp.dueDate! + 'T00:00:00')
    const diff = Math.ceil((d.getTime() - today.getTime()) / 86400000)
    return { cls: 'due-badge-soon', text: diff === 0 ? 'Hoy!' : `En ${diff}d` }
  }
  return { cls: 'due-badge-upcoming', text: 'Futuro' }
}

export function dueCls(exp: Expense) {
  const s = dueStatus(exp)
  return s === 'paid' ? 'due-paid' : s === 'overdue' ? 'due-overdue' : s === 'soon' ? 'due-soon' : 'due-upcoming'
}

export function statusBadge(status: string) {
  if (status === 'pagado') return { cls: 'badge-paid', text: 'Pagado' }
  if (status === 'pendiente-fecha') return { cls: 'badge-pending-date', text: 'Pendiente' }
  return { cls: 'badge-unpaid', text: 'Sin pagar' }
}

export function useCalc() {
  const { expenses, people } = useExpenses()

  const personById = (id: string) => people.find(p => p.id === id) || { id, name: '?', color: '#aaa' }
  const personName = (id: string) => personById(id).name
  const personColor = (id: string) => personById(id).color

  const totalTrip = useMemo(
    () => expenses.reduce((s, e) => s + (e.amount || 0), 0),
    [expenses]
  )

  const statusTotals = useMemo(() => {
    const t: Record<string, number> = { pagado: 0, 'pendiente-fecha': 0, 'sin pagar': 0 }
    expenses.forEach(e => { t[e.status] = (t[e.status] || 0) + (e.amount || 0) })
    return t
  }, [expenses])

  const bySectionData = useMemo(() => {
    const res: Record<number, number> = {}
    SECTIONS.forEach(s => { res[s.id] = 0 })
    expenses.forEach(exp => {
      const sects = exp.sections || []
      sects.forEach(sid => {
        res[sid] = (res[sid] || 0) + (exp.amount || 0) / Math.max(sects.length, 1)
      })
    })
    return res
  }, [expenses])

  const byCategoryData = useMemo(() => {
    const res: Record<string, number> = {}
    expenses.forEach(e => {
      const c = e.category || 'otro'
      res[c] = (res[c] || 0) + (e.amount || 0)
    })
    return res
  }, [expenses])

  const calcBalances = useMemo(() => {
    const paid: Record<string, number> = {}
    const owed: Record<string, number> = {}
    people.forEach(p => { paid[p.id] = 0; owed[p.id] = 0 })
    expenses.forEach(exp => {
      const splits = calcSplits(exp)
      if (exp.paidBy && paid[exp.paidBy] !== undefined) paid[exp.paidBy] += exp.amount || 0
      Object.entries(splits).forEach(([pid, share]) => {
        if (owed[pid] !== undefined) owed[pid] += share
      })
    })
    const balances: Record<string, number> = {}
    people.forEach(p => { balances[p.id] = (paid[p.id] || 0) - (owed[p.id] || 0) })
    return { paid, owed, balances }
  }, [expenses, people])

  const calcSettlements = useMemo(() => {
    const b = calcBalances.balances
    const creditors: { id: string; amt: number }[] = []
    const debtors: { id: string; amt: number }[] = []
    Object.entries(b).forEach(([id, amt]) => {
      if (amt > 0.01) creditors.push({ id, amt })
      else if (amt < -0.01) debtors.push({ id, amt: -amt })
    })
    creditors.sort((a, c) => c.amt - a.amt)
    debtors.sort((a, c) => c.amt - a.amt)
    const settlements: { from: string; to: string; amount: number }[] = []
    let ci = 0, di = 0
    while (ci < creditors.length && di < debtors.length) {
      const c = creditors[ci], d = debtors[di]
      const t = Math.min(c.amt, d.amt)
      if (t > 0.01) settlements.push({ from: d.id, to: c.id, amount: t })
      c.amt -= t; d.amt -= t
      if (c.amt < 0.01) ci++
      if (d.amt < 0.01) di++
    }
    return settlements
  }, [calcBalances])

  return {
    personById, personName, personColor,
    totalTrip, statusTotals, bySectionData, byCategoryData,
    calcBalances, calcSettlements
  }
}
