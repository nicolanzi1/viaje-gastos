'use client'
import { useState } from 'react'
import { ExpensesProvider } from '@/contexts/ExpensesContext'
import TabDashboard from '@/components/TabDashboard'
import TabExpenses from '@/components/TabExpenses'
import TabVencimientos from '@/components/TabVencimientos'
import TabSplits from '@/components/TabSplits'
import TabBySection from '@/components/TabBySection'
import ModalExpense from '@/components/ModalExpense'
import ModalPeople from '@/components/ModalPeople'

const TABS = [
  { id: 'dashboard',    label: 'Resumen' },
  { id: 'expenses',     label: 'Gastos' },
  { id: 'vencimientos', label: 'Vencimientos' },
  { id: 'splits',       label: 'Quien Debe Que' },
  { id: 'bysection',   label: 'Por Destino' }
]

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [expenseModalOpen, setExpenseModalOpen] = useState(false)
  const [peopleModalOpen, setPeopleModalOpen] = useState(false)
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null)

  function openNewExpense() {
    setEditingExpenseId(null)
    setExpenseModalOpen(true)
  }

  function openEditExpense(id: string) {
    setEditingExpenseId(id)
    setExpenseModalOpen(true)
  }

  return (
    <ExpensesProvider>
      <div>
        <header className="app-header">
          <div className="app-title">Gastos del <span>Viaje</span> ✈</div>
          <div className="header-actions">
            <button className="btn btn-ghost btn-sm" onClick={() => setPeopleModalOpen(true)}>Personas</button>
            <button className="btn btn-amber" onClick={openNewExpense}>+ Añadir Gasto</button>
          </div>
        </header>

        <nav className="nav-tabs">
          {TABS.map(tab => (
            <button
              key={tab.id}
              className={`nav-tab${activeTab === tab.id ? ' active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >{tab.label}</button>
          ))}
        </nav>

        <main className="app-body">
          <div style={{ display: activeTab === 'dashboard' ? '' : 'none' }}>
            <TabDashboard onOpenExpense={openEditExpense} />
          </div>
          <div style={{ display: activeTab === 'expenses' ? '' : 'none' }}>
            <TabExpenses onOpenExpense={openEditExpense} />
          </div>
          <div style={{ display: activeTab === 'vencimientos' ? '' : 'none' }}>
            <TabVencimientos />
          </div>
          <div style={{ display: activeTab === 'splits' ? '' : 'none' }}>
            <TabSplits />
          </div>
          <div style={{ display: activeTab === 'bysection' ? '' : 'none' }}>
            <TabBySection />
          </div>
        </main>

        <ModalExpense
          open={expenseModalOpen}
          expenseId={editingExpenseId}
          onClose={() => setExpenseModalOpen(false)}
        />
        <ModalPeople
          open={peopleModalOpen}
          onClose={() => setPeopleModalOpen(false)}
        />
      </div>
    </ExpensesProvider>
  )
}
