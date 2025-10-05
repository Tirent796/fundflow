import { useEffect, useState } from 'react'
import { TrendingUp, TrendingDown, Wallet, Target, Receipt } from 'lucide-react'
import { blink } from '../lib/blink'
import { Transaction, Budget, Goal } from '../types'
import { formatCurrency } from '../utils/helpers'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'

const COLORS = ['#2563EB', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444']

export default function Dashboard() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)

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
      const [txns, bdgs, gls] = await Promise.all([
        blink.db.transactions.list({ where: { userId } }),
        blink.db.budgets.list({ where: { userId } }),
        blink.db.goals.list({ where: { userId } })
      ])
      setTransactions(txns)
      setBudgets(bdgs)
      setGoals(gls)
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>
  }

  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + Number(t.amount), 0)

  const totalExpenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + Number(t.amount), 0)

  const balance = totalIncome - totalExpenses

  const recentTransactions = transactions
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5)

  const expensesByCategory = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + Number(t.amount)
      return acc
    }, {} as Record<string, number>)

  const chartData = Object.entries(expensesByCategory).map(([name, value]) => ({
    name,
    value
  }))

  return (
    <div className="p-8 space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Welcome back! Here's your financial overview.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card rounded-xl p-6 border border-border shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Balance</p>
              <p className="text-3xl font-bold mt-1">{formatCurrency(balance)}</p>
            </div>
            <div className="p-3 bg-primary/10 rounded-lg">
              <Wallet className="w-6 h-6 text-primary" />
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl p-6 border border-border shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Income</p>
              <p className="text-3xl font-bold text-green-600 mt-1">{formatCurrency(totalIncome)}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl p-6 border border-border shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Expenses</p>
              <p className="text-3xl font-bold text-red-600 mt-1">{formatCurrency(totalExpenses)}</p>
            </div>
            <div className="p-3 bg-red-100 rounded-lg">
              <TrendingDown className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-card rounded-xl p-6 border border-border shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Expenses by Category</h3>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {chartData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-muted-foreground">
              No expense data yet
            </div>
          )}
        </div>

        <div className="bg-card rounded-xl p-6 border border-border shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Recent Transactions</h3>
          <div className="space-y-3">
            {recentTransactions.length > 0 ? (
              recentTransactions.map(txn => (
                <div key={txn.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${txn.type === 'income' ? 'bg-green-100' : 'bg-red-100'}`}>
                      <Receipt className={`w-4 h-4 ${txn.type === 'income' ? 'text-green-600' : 'text-red-600'}`} />
                    </div>
                    <div>
                      <p className="font-medium">{txn.category}</p>
                      <p className="text-xs text-muted-foreground">{new Date(txn.date).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <p className={`font-semibold ${txn.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                    {txn.type === 'income' ? '+' : '-'}{formatCurrency(Number(txn.amount))}
                  </p>
                </div>
              ))
            ) : (
              <div className="text-center text-muted-foreground py-8">
                No transactions yet
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-card rounded-xl p-6 border border-border shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Active Budgets</h3>
          <div className="space-y-4">
            {budgets.slice(0, 3).map(budget => {
              const spent = transactions
                .filter(t => t.type === 'expense' && t.category === budget.category)
                .reduce((sum, t) => sum + Number(t.amount), 0)
              const percentage = (spent / Number(budget.limitAmount)) * 100
              return (
                <div key={budget.id}>
                  <div className="flex justify-between text-sm mb-1">
                    <span>{budget.category}</span>
                    <span>{formatCurrency(spent)} / {formatCurrency(Number(budget.limitAmount))}</span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        percentage > 90 ? 'bg-red-500' : percentage > 70 ? 'bg-yellow-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${Math.min(percentage, 100)}%` }}
                    />
                  </div>
                </div>
              )
            })}
            {budgets.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                No budgets set yet
              </div>
            )}
          </div>
        </div>

        <div className="bg-card rounded-xl p-6 border border-border shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Goals Progress</h3>
          <div className="space-y-4">
            {goals.slice(0, 3).map(goal => {
              const percentage = (Number(goal.currentAmount) / Number(goal.targetAmount)) * 100
              return (
                <div key={goal.id}>
                  <div className="flex justify-between text-sm mb-1">
                    <span>{goal.title}</span>
                    <span>{formatCurrency(Number(goal.currentAmount))} / {formatCurrency(Number(goal.targetAmount))}</span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div
                      className="h-2 rounded-full bg-primary transition-all"
                      style={{ width: `${Math.min(percentage, 100)}%` }}
                    />
                  </div>
                </div>
              )
            })}
            {goals.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                No goals set yet
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
