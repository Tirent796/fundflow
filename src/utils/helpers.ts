export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

export function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    'Food & Dining': 'bg-orange-500',
    'Shopping': 'bg-pink-500',
    'Transportation': 'bg-blue-500',
    'Bills & Utilities': 'bg-purple-500',
    'Healthcare': 'bg-red-500',
    'Entertainment': 'bg-yellow-500',
    'Travel': 'bg-cyan-500',
    'Education': 'bg-green-500',
    'Salary': 'bg-emerald-500',
    'Freelance': 'bg-teal-500',
    'Investment': 'bg-indigo-500',
    'Business': 'bg-violet-500',
    'Gift': 'bg-rose-500',
    'Other': 'bg-gray-500'
  }
  return colors[category] || 'bg-gray-500'
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}
