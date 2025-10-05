import { useEffect, useState } from 'react'
import { Plus, Wallet } from 'lucide-react'
import { blink } from '../lib/blink'
import { Budget, Transaction, EXPENSE_CATEGORIES } from '../types'
import { formatCurrency, generateId } from '../utils/helpers'

export default function Budgets() {
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [showModal, setShowModal] = useState(false)
  
  const [formData, setFormData] = useState({
    category: '',
    limitAmount: '',
    period: 'monthly' as 'weekly' | 'monthly' | 'yearly'
  })

  useEffect(() => {
    const unsubscribe = blink.auth.onAuthStateChanged((state) => {
      setUser(state.user)
      if (state.user) {
        loadData(state.user.id)
      }
    })
    return unsubscribe
  }, [])

  async function loadData(userId: string) {
    try {
      const [bdgs, txns] = await Promise.all([
        blink.db.budgets.list({ where: { userId } }),
        blink.db.transactions.list({ where: { userId } })
      ])
      setBudgets(bdgs)
      setTransactions(txns)
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return

    try {
      const newBudget: Budget = {
        id: generateId(),
        userId: user.id,
        category: formData.category,
        limitAmount: parseFloat(formData.limitAmount),
        period: formData.period,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      await blink.db.budgets.create(newBudget)
      setBudgets([...budgets, newBudget])
      setShowModal(false)
      setFormData({ category: '', limitAmount: '', period: 'monthly' })
    } catch (error) {
      console.error('Error creating budget:', error)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>
  }

  return (
    <div className="p-8 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Budgets</h1>
          <p className="text-muted-foreground mt-1">Set spending limits for different categories</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-all"
        >
          <Plus className="w-5 h-5" />
          Add Budget
        </button>
      </div>

      {budgets.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {budgets.map(budget => {
            const spent = transactions
              .filter(t => t.type === 'expense' && t.category === budget.category)
              .reduce((sum, t) => sum + Number(t.amount), 0)
            const percentage = (spent / Number(budget.limitAmount)) * 100
            const remaining = Number(budget.limitAmount) - spent

            return (
              <div key={budget.id} className="bg-card rounded-xl p-6 border border-border shadow-sm">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-lg">{budget.category}</h3>
                    <p className="text-sm text-muted-foreground capitalize">{budget.period}</p>
                  </div>
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Wallet className="w-5 h-5 text-primary" />
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-muted-foreground">Spent</span>
                      <span className="font-semibold">{formatCurrency(spent)}</span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-3">
                      <div
                        className={`h-3 rounded-full transition-all ${
                          percentage > 90 ? 'bg-red-500' : 
                          percentage > 70 ? 'bg-yellow-500' : 
                          'bg-green-500'
                        }`}
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                      />
                    </div>
                  </div>

                  <div className="pt-3 border-t border-border">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Remaining</span>
                      <span className={`font-bold text-lg ${remaining < 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {formatCurrency(remaining)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-sm text-muted-foreground">Budget</span>
                      <span className="text-sm font-medium">{formatCurrency(Number(budget.limitAmount))}</span>
                    </div>
                  </div>

                  {percentage > 90 && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 mt-3">
                      <p className="text-xs text-red-800 font-medium">
                        ⚠️ You've spent {percentage.toFixed(0)}% of your budget!
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="bg-card rounded-xl p-12 border border-border shadow-sm text-center">
          <Wallet className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No budgets set yet. Create one to start tracking your spending!</p>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-xl p-6 w-full max-w-md shadow-xl">
            <h2 className="text-2xl font-bold mb-6">Add Budget</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Category</label>
                <select
                  required
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">Select category</option>
                  {EXPENSE_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Budget Amount</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.limitAmount}
                  onChange={(e) => setFormData({ ...formData, limitAmount: e.target.value })}
                  className="w-full px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Period</label>
                <select
                  required
                  value={formData.period}
                  onChange={(e) => setFormData({ ...formData, period: e.target.value as any })}
                  className="w-full px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-input rounded-lg hover:bg-secondary transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all"
                >
                  Add Budget
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
