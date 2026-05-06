'use client'
import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Expense, Person, Status } from '@/lib/types'
import { uid } from '@/lib/types'

const SEED_PEOPLE: Person[] = [
  { id: 'p1', name: 'Lu+Nico',     color: '#1a4a8a' },
  { id: 'p2', name: 'Mirtha+Luis', color: '#1d6a52' },
  { id: 'p3', name: 'Lore+Gordo',  color: '#6b2d8a' }
]

const SEED_EXPENSES: Expense[] = [
  {
    id: 'e1', name: 'Tren AVLO Madrid - Valencia', category: 'transporte',
    amount: 76.00, paidBy: 'p1', status: 'pagado', dueDate: '2026-06-03',
    sections: [0, 1], people: ['p1', 'p2'],
    notes: 'Loc. HWZV54 - AVLO 05124 - 4 billetes 19 EUR c/u'
  },
  {
    id: 'e2', name: 'Tren Intercity Valencia - Alicante', category: 'transporte',
    amount: 45.40, paidBy: 'p2', status: 'pagado', dueDate: '2026-06-05',
    sections: [1, 2], people: ['p1', 'p2'],
    notes: 'Loc. Y2Y2MU - Intercity 01463 - 4 billetes 11.35 EUR c/u'
  },
  {
    id: 'e3', name: 'Hotel Paris - Triple Room 3 noches', category: 'hoteles',
    amount: 431.10, paidBy: 'p1', status: 'pendiente-fecha', dueDate: '2026-06-19',
    sections: [3], people: ['p1', 'p2'],
    notes: 'Luissana Berroteran - Check-in 19 Jun - 384.30 hab + 23.40 city tax'
  },
  {
    id: 'e4', name: 'Vuelos Alicante - Paris - Alicante', category: 'vuelos',
    amount: 365.70, paidBy: 'p1', status: 'pagado', dueDate: '2026-06-19',
    sections: [3], people: ['p1', 'p2'],
    notes: 'Ref SJ769H + BLY1AQ - Booking.com'
  },
  {
    id: 'e5', name: 'Airbnb Valencia - Apartamento', category: 'airbnb',
    amount: 284.00, paidBy: 'p1', status: 'pagado', dueDate: '2026-06-03',
    sections: [1], people: ['p1', 'p2', 'p3'],
    notes: 'Cod. HMWKKEKJYH - aprox 284 EUR - 3-5 Jun'
  },
  {
    id: 'e6', name: 'Apartamentos Goya 75 - Madrid', category: 'hoteles',
    amount: 561.00, paidBy: 'p2', status: 'pagado', dueDate: '2026-05-30',
    sections: [0], people: ['p1', 'p2', 'p3'],
    notes: 'Booking.com - GBP 561 - 30 May al 3 Jun - Free cancellation'
  }
]

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToExpense(r: Record<string, any>): Expense {
  return {
    id: r.id,
    name: r.name,
    category: r.category,
    amount: Number(r.amount),
    paidBy: r.paid_by,
    status: r.status as Status,
    dueDate: r.due_date || null,
    sections: r.sections || [],
    people: r.people || [],
    notes: r.notes || ''
  }
}

function expenseToRow(exp: Expense) {
  return {
    id: exp.id,
    name: exp.name,
    category: exp.category,
    amount: exp.amount,
    paid_by: exp.paidBy,
    status: exp.status,
    due_date: exp.dueDate || null,
    sections: exp.sections,
    people: exp.people,
    notes: exp.notes
  }
}

interface ExpensesContextType {
  expenses: Expense[]
  people: Person[]
  loading: boolean
  saveExpense: (exp: Expense) => Promise<void>
  deleteExpense: (id: string) => Promise<void>
  renamePerson: (id: string, name: string) => void
}

const ExpensesContext = createContext<ExpensesContextType | null>(null)

export function ExpensesProvider({ children }: { children: React.ReactNode }) {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [people] = useState<Person[]>([...SEED_PEOPLE])
  const [loading, setLoading] = useState(false)

  const loadExpenses = useCallback(async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .order('created_at', { ascending: true })

      if (error) throw error

      if (!data || data.length === 0) {
        const { error: seedError } = await supabase
          .from('expenses')
          .insert(SEED_EXPENSES.map(expenseToRow))
        if (seedError) throw seedError
        setExpenses([...SEED_EXPENSES])
      } else {
        setExpenses(data.map(rowToExpense))
      }
    } catch (e) {
      console.error('Supabase error, falling back to seed data:', e)
      setExpenses(prev => prev.length === 0 ? [...SEED_EXPENSES] : prev)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadExpenses()

    const channel = supabase
      .channel('expenses-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'expenses' }, () => {
        loadExpenses()
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [loadExpenses])

  const saveExpense = useCallback(async (exp: Expense) => {
    const { error } = await supabase.from('expenses').upsert(expenseToRow(exp))
    if (error) throw error
    setExpenses(prev => {
      const idx = prev.findIndex(e => e.id === exp.id)
      if (idx !== -1) {
        const next = [...prev]
        next[idx] = { ...exp }
        return next
      }
      return [...prev, { ...exp }]
    })
  }, [])

  const deleteExpense = useCallback(async (id: string) => {
    const { error } = await supabase.from('expenses').delete().eq('id', id)
    if (error) throw error
    setExpenses(prev => prev.filter(e => e.id !== id))
  }, [])

  const renamePerson = useCallback((id: string, name: string) => {
    if (!name.trim()) return
    // people state is local-only (not persisted to Supabase)
    // We use a ref trick: mutate the original array item in place
    const p = people.find(x => x.id === id)
    if (p) p.name = name.trim()
  }, [people])

  return (
    <ExpensesContext.Provider value={{ expenses, people, loading, saveExpense, deleteExpense, renamePerson }}>
      {children}
    </ExpensesContext.Provider>
  )
}

export function useExpenses() {
  const ctx = useContext(ExpensesContext)
  if (!ctx) throw new Error('useExpenses must be used within ExpensesProvider')
  return ctx
}

export { uid }
