'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { useAuth } from '@/contexts/auth-context'
import { supabase } from '@/lib/supabase'
import { formatCurrency, parseCurrency } from '@/lib/currency'
import { getCurrentMonthRange } from '@/lib/date-utils'
import { getCategoryIcon } from '@/lib/categories'
import { toast } from 'sonner'
import { Target, Save, AlertTriangle, CheckCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Category {
  id: string
  name: string
  color: string
  icon_name: string
}

interface Budget {
  id?: string
  category_id: string
  monthly_limit: number
}

interface BudgetWithSpending extends Budget {
  category: Category
  spent: number
  percentage: number
  isOverBudget: boolean
}

export default function BudgetsPage() {
  const { user } = useAuth()
  const [categories, setCategories] = useState<Category[]>([])
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [budgetInputs, setBudgetInputs] = useState<Record<string, string>>({})
  const [budgetsWithSpending, setBudgetsWithSpending] = useState<BudgetWithSpending[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (user) {
      fetchData()
    }
  }, [user])

  const fetchData = async () => {
    try {
      // Fetch categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('*')
        .order('display_order')

      if (categoriesError) throw categoriesError

      // Fetch existing budgets
      const { data: budgetsData, error: budgetsError } = await supabase
        .from('budgets')
        .select('*')
        .eq('user_id', user!.id)

      if (budgetsError) throw budgetsError

      // Fetch current month spending by category
      const currentMonth = getCurrentMonthRange()
      const { data: spendingData, error: spendingError } = await supabase
        .from('expenses')
        .select('category_id, amount')
        .eq('user_id', user!.id)
        .gte('expense_date', currentMonth.start.toISOString().split('T')[0])
        .lte('expense_date', currentMonth.end.toISOString().split('T')[0])

      if (spendingError) throw spendingError

      // Calculate spending by category
      const spendingByCategory = spendingData?.reduce((acc, expense) => {
        acc[expense.category_id] = (acc[expense.category_id] || 0) + expense.amount
        return acc
      }, {} as Record<string, number>) || {}

      setCategories(categoriesData || [])
      setBudgets(budgetsData || [])

      // Initialize budget inputs
      const inputs: Record<string, string> = {}
      budgetsData?.forEach(budget => {
        inputs[budget.category_id] = (budget.monthly_limit / 100).toFixed(2)
      })
      setBudgetInputs(inputs)

      // Combine budgets with spending data
      const budgetsWithSpendingData: BudgetWithSpending[] = (categoriesData || []).map(category => {
        const budget = budgetsData?.find(b => b.category_id === category.id)
        const spent = spendingByCategory[category.id] || 0
        const monthlyLimit = budget?.monthly_limit || 0
        const percentage = monthlyLimit > 0 ? (spent / monthlyLimit) * 100 : 0
        const isOverBudget = percentage > 100

        return {
          id: budget?.id,
          category_id: category.id,
          monthly_limit: monthlyLimit,
          category,
          spent,
          percentage,
          isOverBudget
        }
      })

      setBudgetsWithSpending(budgetsWithSpendingData)
    } catch (error) {
      console.error('Error fetching budget data:', error)
      toast.error('Failed to load budget data')
    } finally {
      setLoading(false)
    }
  }

  const handleBudgetInputChange = (categoryId: string, value: string) => {
    setBudgetInputs(prev => ({
      ...prev,
      [categoryId]: value
    }))
  }

  const saveBudget = async (categoryId: string) => {
    try {
      setSaving(true)
      const inputValue = budgetInputs[categoryId] || '0'
      const amountInCents = parseCurrency(inputValue)

      if (amountInCents < 0) {
        toast.error('Budget amount must be positive')
        return
      }

      const existingBudget = budgets.find(b => b.category_id === categoryId)

      if (existingBudget) {
        if (amountInCents === 0) {
          // Delete budget if amount is 0
          const { error } = await supabase
            .from('budgets')
            .delete()
            .eq('id', existingBudget.id)
            .eq('user_id', user!.id)

          if (error) throw error

          setBudgets(prev => prev.filter(b => b.id !== existingBudget.id))
          toast.success('Budget removed successfully')
        } else {
          // Update existing budget
          const { error } = await supabase
            .from('budgets')
            .update({ monthly_limit: amountInCents })
            .eq('id', existingBudget.id)
            .eq('user_id', user!.id)

          if (error) throw error

          setBudgets(prev => prev.map(b =>
            b.id === existingBudget.id
              ? { ...b, monthly_limit: amountInCents }
              : b
          ))
          toast.success('Budget updated successfully')
        }
      } else if (amountInCents > 0) {
        // Create new budget
        const { data, error } = await supabase
          .from('budgets')
          .insert({
            user_id: user!.id,
            category_id: categoryId,
            monthly_limit: amountInCents
          })
          .select()
          .single()

        if (error) throw error

        setBudgets(prev => [...prev, data])
        toast.success('Budget created successfully')
      }

      // Refresh budget data
      await fetchData()
    } catch (error) {
      console.error('Error saving budget:', error)
      toast.error('Failed to save budget')
    } finally {
      setSaving(false)
    }
  }

  const saveAllBudgets = async () => {
    try {
      setSaving(true)

      for (const categoryId in budgetInputs) {
        await saveBudget(categoryId)
      }

      toast.success('All budgets saved successfully')
    } catch (error) {
      console.error('Error saving all budgets:', error)
      toast.error('Failed to save some budgets')
    } finally {
      setSaving(false)
    }
  }

  const totalBudget = budgetsWithSpending.reduce((sum, item) => sum + item.monthly_limit, 0)
  const totalSpent = budgetsWithSpending.reduce((sum, item) => sum + item.spent, 0)
  const overBudgetCount = budgetsWithSpending.filter(item => item.isOverBudget && item.monthly_limit > 0).length

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-muted animate-pulse rounded w-1/4" />
        <div className="grid gap-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="h-4 bg-muted animate-pulse rounded w-1/3" />
                  <div className="h-10 bg-muted animate-pulse rounded" />
                  <div className="h-2 bg-muted animate-pulse rounded" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Budget Management</h1>
        <Button onClick={saveAllBudgets} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          Save All Budgets
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalBudget)}
            </div>
            <p className="text-xs text-muted-foreground">
              Monthly budget limit
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalSpent)}
            </div>
            <p className="text-xs text-muted-foreground">
              {totalBudget > 0 ? `${((totalSpent / totalBudget) * 100).toFixed(1)}% of budget` : 'No budget set'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Budget Status</CardTitle>
            {overBudgetCount > 0 ? (
              <AlertTriangle className="h-4 w-4 text-red-500" />
            ) : (
              <CheckCircle className="h-4 w-4 text-green-500" />
            )}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {overBudgetCount > 0 ? `${overBudgetCount}` : '✓'}
            </div>
            <p className="text-xs text-muted-foreground">
              {overBudgetCount > 0 ? 'Over budget' : 'On track'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Budget Settings */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Set Monthly Budgets</h2>

        {budgetsWithSpending.map((item) => {
          const Icon = getCategoryIcon(item.category.icon_name)
          const inputValue = budgetInputs[item.category_id] || ''
          const hasChanges = inputValue !== (item.monthly_limit / 100).toFixed(2)

          return (
            <Card key={item.category_id}>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {/* Category Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div
                        className="p-2 rounded-full"
                        style={{ backgroundColor: item.category.color + '20' }}
                      >
                        <Icon
                          className="h-5 w-5"
                          style={{ color: item.category.color }}
                        />
                      </div>
                      <h3 className="font-medium text-lg">{item.category.name}</h3>
                    </div>
                    {item.monthly_limit > 0 && (
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">
                          {formatCurrency(item.spent)} / {formatCurrency(item.monthly_limit)}
                        </p>
                        <p className={cn(
                          "text-sm font-medium",
                          item.isOverBudget ? "text-red-500" : "text-green-600"
                        )}>
                          {item.percentage.toFixed(1)}% used
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Budget Input */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <div className="space-y-2">
                      <Label htmlFor={`budget-${item.category_id}`}>
                        Monthly Budget
                      </Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                          $
                        </span>
                        <Input
                          id={`budget-${item.category_id}`}
                          type="text"
                          inputMode="decimal"
                          placeholder="0.00"
                          value={inputValue}
                          onChange={(e) => handleBudgetInputChange(item.category_id, e.target.value)}
                          className="pl-8"
                        />
                      </div>
                    </div>

                    <div className="md:col-span-1">
                      <Button
                        onClick={() => saveBudget(item.category_id)}
                        disabled={saving || !hasChanges}
                        size="sm"
                        className="w-full md:w-auto"
                      >
                        {saving ? 'Saving...' : 'Save'}
                      </Button>
                    </div>

                    <div className="text-sm text-muted-foreground">
                      {inputValue && parseCurrency(inputValue) > 0 && (
                        <p>Budget: {formatCurrency(parseCurrency(inputValue))}</p>
                      )}
                    </div>
                  </div>

                  {/* Progress Bar */}
                  {item.monthly_limit > 0 && (
                    <div className="space-y-2">
                      <Progress
                        value={Math.min(item.percentage, 100)}
                        className={cn(
                          "h-2",
                          item.isOverBudget && "bg-red-100"
                        )}
                      />
                      {item.isOverBudget && (
                        <p className="text-xs text-red-500 flex items-center">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Over budget by {formatCurrency(item.spent - item.monthly_limit)}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Tips */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Budget Tips</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>• Set realistic budgets based on your spending history</p>
            <p>• Review and adjust your budgets monthly</p>
            <p>• Use the 50/30/20 rule: 50% needs, 30% wants, 20% savings</p>
            <p>• Set a budget of $0 to remove a category budget</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}