import { useEffect, useState } from 'react'
import { Plus, Target, DollarSign } from 'lucide-react'
import { blink } from '../lib/blink'
import { Goal } from '../types'
import { formatCurrency, formatDate, generateId } from '../utils/helpers'

export default function Goals() {
  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [showModal, setShowModal] = useState(false)
  const [showContributeModal, setShowContributeModal] = useState(false)
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null)
  const [contributeAmount, setContributeAmount] = useState('')
  
  const [formData, setFormData] = useState({
    title: '',
    targetAmount: '',
    currentAmount: '0',
    deadline: ''
  })

  useEffect(() => {
    const unsubscribe = blink.auth.onAuthStateChanged((state) => {
      setUser(state.user)
      if (state.user) {
        loadGoals(state.user.id)
      }
    })
    return unsubscribe
  }, [])

  async function loadGoals(userId: string) {
    try {
      const gls = await blink.db.goals.list({ where: { userId } })
      setGoals(gls)
    } catch (error) {
      console.error('Error loading goals:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return

    try {
      const newGoal: Goal = {
        id: generateId(),
        userId: user.id,
        title: formData.title,
        targetAmount: parseFloat(formData.targetAmount),
        currentAmount: parseFloat(formData.currentAmount),
        deadline: formData.deadline || undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      await blink.db.goals.create(newGoal)
      setGoals([...goals, newGoal])
      setShowModal(false)
      setFormData({ title: '', targetAmount: '', currentAmount: '0', deadline: '' })
    } catch (error) {
      console.error('Error creating goal:', error)
    }
  }

  async function handleContribute(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedGoal || !contributeAmount) return

    try {
      const newAmount = Number(selectedGoal.currentAmount) + parseFloat(contributeAmount)
      await blink.db.goals.update(selectedGoal.id, {
        currentAmount: newAmount,
        updatedAt: new Date().toISOString()
      })

      setGoals(goals.map(g => 
        g.id === selectedGoal.id 
          ? { ...g, currentAmount: newAmount }
          : g
      ))
      setShowContributeModal(false)
      setContributeAmount('')
      setSelectedGoal(null)
    } catch (error) {
      console.error('Error updating goal:', error)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>
  }

  return (
    <div className="p-8 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Goals</h1>
          <p className="text-muted-foreground mt-1">Track your savings goals and progress</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-all"
        >
          <Plus className="w-5 h-5" />
          Add Goal
        </button>
      </div>

      {goals.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {goals.map(goal => {
            const percentage = (Number(goal.currentAmount) / Number(goal.targetAmount)) * 100
            const remaining = Number(goal.targetAmount) - Number(goal.currentAmount)
            const isCompleted = percentage >= 100

            return (
              <div key={goal.id} className="bg-card rounded-xl p-6 border border-border shadow-sm">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{goal.title}</h3>
                    {goal.deadline && (
                      <p className="text-sm text-muted-foreground">Due: {formatDate(goal.deadline)}</p>
                    )}
                  </div>
                  <div className={`p-2 rounded-lg ${isCompleted ? 'bg-green-100' : 'bg-primary/10'}`}>
                    <Target className={`w-5 h-5 ${isCompleted ? 'text-green-600' : 'text-primary'}`} />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="relative">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-semibold">{percentage.toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-4 overflow-hidden">
                      <div
                        className={`h-4 rounded-full transition-all ${
                          isCompleted ? 'bg-green-500' : 'bg-primary'
                        }`}
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                      />
                    </div>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-border">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Current</span>
                      <span className="font-semibold">{formatCurrency(Number(goal.currentAmount))}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Target</span>
                      <span className="font-semibold">{formatCurrency(Number(goal.targetAmount))}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Remaining</span>
                      <span className={`font-bold ${isCompleted ? 'text-green-600' : 'text-primary'}`}>
                        {formatCurrency(Math.max(remaining, 0))}
                      </span>
                    </div>
                  </div>

                  {!isCompleted && (
                    <button
                      onClick={() => {
                        setSelectedGoal(goal)
                        setShowContributeModal(true)
                      }}
                      className="w-full mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all flex items-center justify-center gap-2"
                    >
                      <DollarSign className="w-4 h-4" />
                      Contribute
                    </button>
                  )}

                  {isCompleted && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 mt-4">
                      <p className="text-sm text-green-800 font-medium text-center">
                        🎉 Goal achieved!
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
          <Target className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No goals set yet. Create one to start saving!</p>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-xl p-6 w-full max-w-md shadow-xl">
            <h2 className="text-2xl font-bold mb-6">Add Goal</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Goal Title</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="e.g., Emergency Fund, Vacation, New Car"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Target Amount</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.targetAmount}
                  onChange={(e) => setFormData({ ...formData, targetAmount: e.target.value })}
                  className="w-full px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Current Amount</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.currentAmount}
                  onChange={(e) => setFormData({ ...formData, currentAmount: e.target.value })}
                  className="w-full px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Deadline (optional)</label>
                <input
                  type="date"
                  value={formData.deadline}
                  onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                  className="w-full px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                />
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
                  Add Goal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showContributeModal && selectedGoal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-xl p-6 w-full max-w-md shadow-xl">
            <h2 className="text-2xl font-bold mb-2">Contribute to Goal</h2>
            <p className="text-muted-foreground mb-6">{selectedGoal.title}</p>
            <form onSubmit={handleContribute} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Amount to Add</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={contributeAmount}
                  onChange={(e) => setContributeAmount(e.target.value)}
                  className="w-full px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="0.00"
                  autoFocus
                />
              </div>

              <div className="bg-secondary rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Current Amount:</span>
                  <span className="font-semibold">{formatCurrency(Number(selectedGoal.currentAmount))}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Adding:</span>
                  <span className="font-semibold text-primary">+{formatCurrency(parseFloat(contributeAmount || '0'))}</span>
                </div>
                <div className="flex justify-between text-sm pt-2 border-t border-border">
                  <span>New Amount:</span>
                  <span className="font-bold">{formatCurrency(Number(selectedGoal.currentAmount) + parseFloat(contributeAmount || '0'))}</span>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowContributeModal(false)
                    setContributeAmount('')
                    setSelectedGoal(null)
                  }}
                  className="flex-1 px-4 py-2 border border-input rounded-lg hover:bg-secondary transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all"
                >
                  Contribute
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
