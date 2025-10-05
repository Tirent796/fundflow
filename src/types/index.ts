export interface Transaction {
  id: string
  userId: string
  type: 'income' | 'expense'
  amount: number
  category: string
  description?: string
  date: string
  createdAt: string
  updatedAt: string
}

export interface Budget {
  id: string
  userId: string
  category: string
  limitAmount: number
  period: 'weekly' | 'monthly' | 'yearly'
  spent?: number
  createdAt: string
  updatedAt: string
}

export interface Goal {
  id: string
  userId: string
  title: string
  targetAmount: number
  currentAmount: number
  deadline?: string
  createdAt: string
  updatedAt: string
}

export interface Notification {
  id: string
  userId: string
  type: string
  message: string
  isRead: string
  createdAt: string
}

export const EXPENSE_CATEGORIES = [
  'Food & Dining',
  'Shopping',
  'Transportation',
  'Bills & Utilities',
  'Healthcare',
  'Entertainment',
  'Travel',
  'Education',
  'Other'
]

export const INCOME_CATEGORIES = [
  'Salary',
  'Freelance',
  'Investment',
  'Business',
  'Gift',
  'Other'
]
