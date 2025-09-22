'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { PlusCircle, DollarSign } from 'lucide-react'
import Link from 'next/link'
import { useCurrency } from '@/contexts/currency-context'
import { ExpensePieChart } from '@/components/charts/expense-pie-chart'
import { useAuth } from '@/contexts/auth-context'
import { supabase } from '@/lib/supabase'
import { getCurrentMonthRange, getLastMonthRange, getTodayRange, getYesterdayRange, getLast7DaysRange } from '@/lib/date-utils'
import { getAllBudgetStatuses, showBudgetSummaryNotification } from '@/lib/budget-notifications'

interface DashboardData {
  todayTotal: number
  yesterdayTotal: number
  currentMonthTotal: number
  lastMonthTotal: number
  last7DaysData: Array<{
    date: string
    total: number
  }>
  currentMonthByCategory: Array<{
    category_name: string
    category_emoji: string
    total: number
    color: string
  }>
  budgetProgress: Array<{
    category_name: string
    category_emoji: string
    spent: number
    budget: number
    color: string
  }>
  recentExpenses: Array<{
    id: string
    amount: number
    description: string
    category_name: string
    category_emoji: string
    expense_date: string
  }>
}

export default function DashboardPage() {
  const { user } = useAuth()
  const { formatCurrency } = useCurrency()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchDashboardData = useCallback(async () => {
    try {
      const currentMonth = getCurrentMonthRange()
      const lastMonth = getLastMonthRange()
      const today = getTodayRange()
      const yesterday = getYesterdayRange()
      const last7Days = getLast7DaysRange()

      // Fetch today's total
      const { data: todayExpenses } = await supabase
        .from('expenses')
        .select('amount')
        .eq('user_id', user!.id)
        .gte('expense_date', today.start.toISOString().split('T')[0])
        .lte('expense_date', today.end.toISOString().split('T')[0])

      // Fetch yesterday's total
      const { data: yesterdayExpenses } = await supabase
        .from('expenses')
        .select('amount')
        .eq('user_id', user!.id)
        .gte('expense_date', yesterday.start.toISOString().split('T')[0])
        .lte('expense_date', yesterday.end.toISOString().split('T')[0])

      // Fetch current month total
      const { data: currentMonthExpenses } = await supabase
        .from('expenses')
        .select('amount')
        .eq('user_id', user!.id)
        .gte('expense_date', currentMonth.start.toISOString().split('T')[0])
        .lte('expense_date', currentMonth.end.toISOString().split('T')[0])

      // Fetch last month total
      const { data: lastMonthExpenses } = await supabase
        .from('expenses')
        .select('amount')
        .eq('user_id', user!.id)
        .gte('expense_date', lastMonth.start.toISOString().split('T')[0])
        .lte('expense_date', lastMonth.end.toISOString().split('T')[0])

      // Fetch last 7 days data for chart
      const { data: last7DaysExpenses } = await supabase
        .from('expenses')
        .select('amount, expense_date')
        .eq('user_id', user!.id)
        .gte('expense_date', last7Days.start.toISOString().split('T')[0])
        .lte('expense_date', last7Days.end.toISOString().split('T')[0])

      // Fetch current month by category
      const { data: categorySpending } = await supabase
        .from('expenses')
        .select(`
          amount,
          categories (name, color, emoji)
        `)
        .eq('user_id', user!.id)
        .gte('expense_date', currentMonth.start.toISOString().split('T')[0])
        .lte('expense_date', currentMonth.end.toISOString().split('T')[0])

      // Fetch budget progress
      const { data: budgets } = await supabase
        .from('budgets')
        .select(`
          monthly_limit,
          categories (name, color, emoji)
        `)
        .eq('user_id', user!.id)

      // Fetch recent expenses
      const { data: recentExpenses } = await supabase
        .from('expenses')
        .select(`
          id,
          amount,
          description,
          expense_date,
          categories (name, emoji)
        `)
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(5)

      // Process data
      const todayTotal = todayExpenses?.reduce((sum, exp) => sum + exp.amount, 0) || 0
      const yesterdayTotal = yesterdayExpenses?.reduce((sum, exp) => sum + exp.amount, 0) || 0
      const currentMonthTotal = currentMonthExpenses?.reduce((sum, exp) => sum + exp.amount, 0) || 0
      const lastMonthTotal = lastMonthExpenses?.reduce((sum, exp) => sum + exp.amount, 0) || 0

      // Process 7-day data for chart
      const dailyTotals = new Map<string, number>()
      last7DaysExpenses?.forEach((expense: { amount: number; expense_date: string }) => {
        const date = expense.expense_date
        dailyTotals.set(date, (dailyTotals.get(date) || 0) + expense.amount)
      })

      const last7DaysData = Array.from({ length: 7 }, (_, i) => {
        const date = new Date()
        date.setDate(date.getDate() - (6 - i))
        const dateStr = date.toISOString().split('T')[0]
        return {
          date: dateStr,
          total: dailyTotals.get(dateStr) || 0
        }
      })

      // Group spending by category
      const categoryTotals = new Map<string, { total: number; color: string; emoji: string }>()
      categorySpending?.forEach((expense: { amount: number; categories: { name: string; color: string; emoji: string }[] }) => {
        const category = expense.categories[0] // Take first category (should only be one)
        if (category) {
          const categoryName = category.name
          const current = categoryTotals.get(categoryName) || {
            total: 0,
            color: category.color,
            emoji: category.emoji
          }
          current.total += expense.amount
          categoryTotals.set(categoryName, current)
        }
      })

      const currentMonthByCategory = Array.from(categoryTotals.entries()).map(([name, data]) => ({
        category_name: name,
        category_emoji: data.emoji,
        total: data.total,
        color: data.color
      }))

      // Calculate budget progress
      const budgetProgress = budgets?.map((budget: { monthly_limit: number; categories: { name: string; color: string; emoji: string }[] }) => {
        const category = budget.categories[0] // Take first category (should only be one)
        const spent = category ? categoryTotals.get(category.name)?.total || 0 : 0
        return {
          category_name: category?.name || '',
          category_emoji: category?.emoji || '',
          spent,
          budget: budget.monthly_limit,
          color: category?.color || '#000000'
        }
      }) || []

      setData({
        todayTotal,
        yesterdayTotal,
        currentMonthTotal,
        lastMonthTotal,
        last7DaysData,
        currentMonthByCategory,
        budgetProgress,
        recentExpenses: recentExpenses?.map((exp: {
          id: string;
          amount: number;
          description: string;
          expense_date: string;
          categories: { name: string; emoji: string }[]
        }) => ({
          id: exp.id,
          amount: exp.amount,
          description: exp.description,
          category_name: exp.categories[0]?.name || '',
          category_emoji: exp.categories[0]?.emoji || '',
          expense_date: exp.expense_date
        })) || []
      })

      // Check budget statuses and show summary notification
      const budgetStatuses = await getAllBudgetStatuses(user!.id)
      if (budgetStatuses.length > 0) {
        // Delay the notification slightly to avoid overwhelming the user
        setTimeout(() => {
          showBudgetSummaryNotification(budgetStatuses)
        }, 2000)
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (user) {
      fetchDashboardData()
    }
  }, [user, fetchDashboardData])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <div className="h-4 bg-muted animate-pulse rounded" />
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted animate-pulse rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  const monthOverMonthChange = data?.lastMonthTotal
    ? ((data.currentMonthTotal - data.lastMonthTotal) / data.lastMonthTotal) * 100
    : 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <Button asChild>
          <Link href="/add-expense">
            <PlusCircle className="h-4 w-4 mr-2" />
            Add Expense
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Today's Spending - Prominent */}
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              🌟 Today&apos;s Spending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">
              {formatCurrency(data?.todayTotal || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Yesterday: {formatCurrency(data?.yesterdayTotal || 0)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(data?.currentMonthTotal || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {monthOverMonthChange > 0 ? '+' : ''}{monthOverMonthChange.toFixed(1)}% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data?.currentMonthByCategory.length || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Used this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Budgets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data?.budgetProgress.filter(b => b.budget > 0).length || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Active budgets
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Expense Distribution Pie Chart */}
      {data?.currentMonthByCategory && data.currentMonthByCategory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              📊 Monthly Expense Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ExpensePieChart data={data.currentMonthByCategory} />
          </CardContent>
        </Card>
      )}

      {/* Budget Progress */}
      {data?.budgetProgress && data.budgetProgress.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Budget Progress</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.budgetProgress.map((item) => {
              const percentage = item.budget > 0 ? (item.spent / item.budget) * 100 : 0
              const isOverBudget = percentage > 100

              const remaining = item.budget - item.spent

              return (
                <div key={item.category_name} className="space-y-3 p-4 rounded-lg border bg-card">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center text-xl"
                        style={{ backgroundColor: item.color + '20' }}
                      >
                        {item.category_emoji}
                      </div>
                      <div>
                        <span className="font-medium text-lg">{item.category_name}</span>
                        <div className="flex items-center gap-4 mt-1">
                          <span className="text-sm text-muted-foreground">
                            Budget: <span className="font-medium">{formatCurrency(item.budget)}</span>
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">
                        {formatCurrency(item.spent)}
                      </div>
                      <div className={`text-sm font-medium ${isOverBudget ? 'text-red-500' : 'text-green-600'}`}>
                        {isOverBudget
                          ? `Over by ${formatCurrency(Math.abs(remaining))}`
                          : `${formatCurrency(remaining)} left`
                        }
                      </div>
                    </div>
                  </div>
                  <Progress
                    value={Math.min(percentage, 100)}
                    className={`h-3 ${isOverBudget ? 'bg-red-100' : ''}`}
                  />
                  <div className="text-xs text-muted-foreground text-center">
                    {percentage.toFixed(1)}% of budget used
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>
      )}

      {/* Recent Expenses */}
      {data?.recentExpenses && data.recentExpenses.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.recentExpenses.map((expense) => (
                <div key={expense.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">
                      {expense.category_emoji}
                    </div>
                    <div>
                      <p className="font-medium">
                        {expense.description || expense.category_name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {expense.category_name} • {new Date(expense.expense_date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="font-bold text-lg">
                    {formatCurrency(expense.amount)}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <Button variant="outline" asChild className="w-full">
                <Link href="/expenses">View All Expenses</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {(!data?.recentExpenses || data.recentExpenses.length === 0) && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <DollarSign className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No expenses yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Start tracking your expenses to see your spending insights here.
            </p>
            <Button asChild>
              <Link href="/add-expense">
                <PlusCircle className="h-4 w-4 mr-2" />
                Add Your First Expense
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}