import { useState, useEffect } from 'react'
import { blink } from './lib/blink'
import Sidebar from './components/Sidebar'
import Dashboard from './components/Dashboard'
import Transactions from './components/Transactions'
import Budgets from './components/Budgets'
import Goals from './components/Goals'
import Reports from './components/Reports'

function App() {
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState('dashboard')

  useEffect(() => {
    const unsubscribe = blink.auth.onAuthStateChanged((state) => {
      setUser(state.user)
      setIsLoading(state.isLoading)
    })
    return unsubscribe
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="bg-card rounded-2xl shadow-2xl p-12 max-w-md w-full text-center">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-primary mb-2">Budget App</h1>
            <p className="text-muted-foreground">Take control of your finances</p>
          </div>
          <div className="space-y-4 mb-8">
            <div className="flex items-center gap-3 text-left">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="text-primary font-bold">📊</span>
              </div>
              <p className="text-sm text-foreground">Track expenses and income</p>
            </div>
            <div className="flex items-center gap-3 text-left">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="text-primary font-bold">💰</span>
              </div>
              <p className="text-sm text-foreground">Set budgets and goals</p>
            </div>
            <div className="flex items-center gap-3 text-left">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="text-primary font-bold">📈</span>
              </div>
              <p className="text-sm text-foreground">Visualize your financial trends</p>
            </div>
          </div>
          <button
            onClick={() => blink.auth.login()}
            className="w-full bg-primary text-primary-foreground py-3 rounded-lg font-semibold hover:bg-primary/90 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            Get Started
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar currentPage={currentPage} onNavigate={setCurrentPage} />
      <main className="flex-1 overflow-y-auto">
        {currentPage === 'dashboard' && <Dashboard />}
        {currentPage === 'transactions' && <Transactions />}
        {currentPage === 'budgets' && <Budgets />}
        {currentPage === 'goals' && <Goals />}
        {currentPage === 'reports' && <Reports />}
      </main>
    </div>
  )
}

export default App 