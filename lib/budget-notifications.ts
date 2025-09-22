import { supabase } from '@/lib/supabase'
import { getCurrentMonthRange } from '@/lib/date-utils'
import { formatCurrency } from '@/lib/currency'
import { toast } from 'sonner'

interface BudgetStatus {
  categoryName: string
  spent: number
  budget: number
  percentage: number
  color: string
}

export async function checkBudgetStatus(userId: string, categoryId: string): Promise<void> {
  try {
    // Get the budget for this category
    const { data: budget, error: budgetError } = await supabase
      .from('budgets')
      .select(`
        monthly_limit,
        categories (name, color)
      `)
      .eq('user_id', userId)
      .eq('category_id', categoryId)
      .single()

    if (budgetError || !budget) {
      // No budget set for this category
      return
    }

    // Get current month spending for this category
    const currentMonth = getCurrentMonthRange()
    const { data: expenses, error: expensesError } = await supabase
      .from('expenses')
      .select('amount')
      .eq('user_id', userId)
      .eq('category_id', categoryId)
      .gte('expense_date', currentMonth.start.toISOString().split('T')[0])
      .lte('expense_date', currentMonth.end.toISOString().split('T')[0])

    if (expensesError) {
      console.error('Error fetching expenses for budget check:', expensesError)
      return
    }

    const totalSpent = expenses?.reduce((sum, expense) => sum + expense.amount, 0) || 0
    const percentage = (totalSpent / budget.monthly_limit) * 100

    const categories = budget.categories as { name: string; color: string }[]
    const category = categories[0] // Take first category
    const status: BudgetStatus = {
      categoryName: category?.name || '',
      spent: totalSpent,
      budget: budget.monthly_limit,
      percentage,
      color: category?.color || '#000000'
    }

    // Show notifications based on percentage
    if (percentage >= 100) {
      toast.error(
        `🚨 Budget Exceeded: ${status.categoryName}`,
        {
          description: `You've spent ${formatCurrency(status.spent)} (${percentage.toFixed(1)}%) of your ${formatCurrency(status.budget)} budget.`,
          duration: 8000,
        }
      )
    } else if (percentage >= 80) {
      toast.warning(
        `⚠️ Budget Alert: ${status.categoryName}`,
        {
          description: `You've used ${percentage.toFixed(1)}% of your budget. ${formatCurrency(status.budget - status.spent)} remaining.`,
          duration: 6000,
        }
      )
    }
  } catch (error) {
    console.error('Error checking budget status:', error)
  }
}

export async function getAllBudgetStatuses(userId: string): Promise<BudgetStatus[]> {
  try {
    // Get all budgets for the user
    const { data: budgets, error: budgetsError } = await supabase
      .from('budgets')
      .select(`
        category_id,
        monthly_limit,
        categories (name, color)
      `)
      .eq('user_id', userId)

    if (budgetsError || !budgets) {
      return []
    }

    // Get current month spending by category
    const currentMonth = getCurrentMonthRange()
    const { data: expenses, error: expensesError } = await supabase
      .from('expenses')
      .select('category_id, amount')
      .eq('user_id', userId)
      .gte('expense_date', currentMonth.start.toISOString().split('T')[0])
      .lte('expense_date', currentMonth.end.toISOString().split('T')[0])

    if (expensesError) {
      console.error('Error fetching expenses for budget statuses:', expensesError)
      return []
    }

    // Calculate spending by category
    const spendingByCategory = expenses?.reduce((acc, expense) => {
      acc[expense.category_id] = (acc[expense.category_id] || 0) + expense.amount
      return acc
    }, {} as Record<string, number>) || {}

    // Create budget statuses
    return budgets.map(budget => {
      const spent = spendingByCategory[budget.category_id] || 0
      const percentage = (spent / budget.monthly_limit) * 100
      const categories = budget.categories as { name: string; color: string }[]
      const category = categories[0] // Take first category

      return {
        categoryName: category?.name || '',
        spent,
        budget: budget.monthly_limit,
        percentage,
        color: category?.color || '#000000'
      }
    })
  } catch (error) {
    console.error('Error getting budget statuses:', error)
    return []
  }
}

export function showBudgetSummaryNotification(statuses: BudgetStatus[]): void {
  const overBudgetCategories = statuses.filter(s => s.percentage >= 100)
  const nearBudgetCategories = statuses.filter(s => s.percentage >= 80 && s.percentage < 100)

  if (overBudgetCategories.length > 0) {
    toast.error(
      `💸 ${overBudgetCategories.length} Budget${overBudgetCategories.length === 1 ? '' : 's'} Exceeded`,
      {
        description: `${overBudgetCategories.map(s => s.categoryName).join(', ')} over budget this month.`,
        duration: 10000,
      }
    )
  } else if (nearBudgetCategories.length > 0) {
    toast.warning(
      `⚠️ ${nearBudgetCategories.length} Budget Warning${nearBudgetCategories.length === 1 ? '' : 's'}`,
      {
        description: `${nearBudgetCategories.map(s => s.categoryName).join(', ')} approaching budget limits.`,
        duration: 8000,
      }
    )
  }
}