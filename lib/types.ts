export type Status = 'pagado' | 'pendiente-fecha' | 'sin pagar'

export interface Expense {
  id: string
  name: string
  category: string
  amount: number
  paidBy: string
  status: Status
  dueDate: string | null
  sections: number[]
  people: string[]
  notes: string
}

export interface Person {
  id: string
  name: string
  color: string
}

export const SECTIONS = [
  { id: 0, name: 'Madrid',     dates: '30 May - 3 Jun',  color: '#1a4a8a' },
  { id: 1, name: 'Valencia',   dates: '3 Jun - 5 Jun',   color: '#1d6a52' },
  { id: 2, name: 'Torrevieja', dates: '5 Jun - 28 Jun',  color: '#c8871a' },
  { id: 3, name: 'Paris',      dates: '19 Jun - 22 Jun', color: '#c0394b' }
]

export const CAT_COLORS: Record<string, string> = {
  vuelos: '#1a4a8a', hoteles: '#6b2d8a', airbnb: '#c0394b',
  comida: '#a05c00', transporte: '#1d6a52', actividades: '#2d6a2d', otro: '#6b6559'
}

export const uid = () => Math.random().toString(36).slice(2, 10)
