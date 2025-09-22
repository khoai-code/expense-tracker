'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/contexts/auth-context'
import { supabase } from '@/lib/supabase'
import { formatCurrency } from '@/lib/currency'
import { formatDate } from '@/lib/date-utils'
import { getCategoryIcon } from '@/lib/categories'
import { toast } from 'sonner'
import {
  Search,
  Edit2,
  Trash2,
  PlusCircle,
  Calendar,
  MoreVertical
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import Link from 'next/link'

interface Expense {
  id: string
  amount: number
  description: string
  expense_date: string
  created_at: string
  categories: {
    name: string
    color: string
    icon_name: string
  }[]
}

interface Category {
  id: string
  name: string
  color: string
  icon_name: string
}

export default function ExpensesPage() {
  const { user } = useAuth()
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [dateFilter, setDateFilter] = useState<string>('current-month')
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)

  const ITEMS_PER_PAGE = 20

  useEffect(() => {
    if (user) {
      fetchCategories()
      fetchExpenses(true)
    }
  }, [user, searchQuery, selectedCategory, dateFilter])

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('display_order')

      if (error) throw error
      setCategories(data || [])
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const getDateRange = (filter: string) => {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)
    const startOfLast3Months = new Date(now.getFullYear(), now.getMonth() - 2, 1)

    switch (filter) {
      case 'current-month':
        return { start: startOfMonth, end: now }
      case 'last-month':
        return { start: startOfLastMonth, end: endOfLastMonth }
      case 'last-3-months':
        return { start: startOfLast3Months, end: now }
      default:
        return null
    }
  }

  const fetchExpenses = async (reset = false) => {
    try {
      setLoading(reset)
      const currentPage = reset ? 0 : page

      let query = supabase
        .from('expenses')
        .select(`
          id,
          amount,
          description,
          expense_date,
          created_at,
          categories (name, color, icon_name)
        `)
        .eq('user_id', user!.id)
        .order('expense_date', { ascending: false })
        .order('created_at', { ascending: false })
        .range(currentPage * ITEMS_PER_PAGE, (currentPage + 1) * ITEMS_PER_PAGE - 1)

      // Apply date filter
      if (dateFilter !== 'all') {
        const dateRange = getDateRange(dateFilter)
        if (dateRange) {
          query = query
            .gte('expense_date', dateRange.start.toISOString().split('T')[0])
            .lte('expense_date', dateRange.end.toISOString().split('T')[0])
        }
      }

      // Apply category filter
      if (selectedCategory) {
        query = query.eq('category_id', selectedCategory)
      }

      // Apply search filter
      if (searchQuery) {
        query = query.ilike('description', `%${searchQuery}%`)
      }

      const { data, error } = await query

      if (error) throw error

      const newExpenses = data || []

      if (reset) {
        setExpenses(newExpenses)
        setPage(0)
      } else {
        setExpenses(prev => [...prev, ...newExpenses])
      }

      setHasMore(newExpenses.length === ITEMS_PER_PAGE)
    } catch (error) {
      console.error('Error fetching expenses:', error)
      toast.error('Failed to load expenses')
    } finally {
      setLoading(false)
    }
  }

  const loadMore = () => {
    if (hasMore && !loading) {
      setPage(prev => prev + 1)
      fetchExpenses()
    }
  }

  const deleteExpense = async (expenseId: string) => {
    try {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', expenseId)
        .eq('user_id', user!.id)

      if (error) throw error

      setExpenses(prev => prev.filter(expense => expense.id !== expenseId))
      toast.success('Expense deleted successfully')
    } catch (error) {
      console.error('Error deleting expense:', error)
      toast.error('Failed to delete expense')
    }
  }

  // Group expenses by date
  const groupedExpenses = expenses.reduce((groups, expense) => {
    const date = expense.expense_date
    if (!groups[date]) {
      groups[date] = []
    }
    groups[date].push(expense)
    return groups
  }, {} as Record<string, Expense[]>)

  const totalAmount = expenses.reduce((sum, expense) => sum + expense.amount, 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Expenses</h1>
        <Button asChild>
          <Link href="/add-expense">
            <PlusCircle className="h-4 w-4 mr-2" />
            Add Expense
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-3">
            {/* Search */}
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search descriptions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Category Filter */}
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <select
                id="category"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm"
              >
                <option value="">All Categories</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Filter */}
            <div className="space-y-2">
              <Label htmlFor="date-filter">Date Range</Label>
              <select
                id="date-filter"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm"
              >
                <option value="current-month">Current Month</option>
                <option value="last-month">Last Month</option>
                <option value="last-3-months">Last 3 Months</option>
                <option value="all">All Time</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      {expenses.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  {expenses.length} expense{expenses.length !== 1 ? 's' : ''} found
                </p>
                <p className="text-2xl font-bold">
                  Total: {formatCurrency(totalAmount)}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Expenses List */}
      {loading && expenses.length === 0 ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <div className="h-4 bg-muted animate-pulse rounded w-1/4" />
                  <div className="h-6 bg-muted animate-pulse rounded w-3/4" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : Object.keys(groupedExpenses).length > 0 ? (
        <div className="space-y-6">
          {Object.entries(groupedExpenses)
            .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
            .map(([date, dayExpenses]) => {
              const dayTotal = dayExpenses.reduce((sum, expense) => sum + expense.amount, 0)

              return (
                <div key={date} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-lg">
                      {formatDate(date)}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {formatCurrency(dayTotal)}
                    </p>
                  </div>

                  <div className="space-y-2">
                    {dayExpenses.map((expense) => {
                      const category = expense.categories[0] // Take first category
                      const Icon = getCategoryIcon(category?.icon_name || '')

                      return (
                        <Card key={expense.id}>
                          <CardContent className="pt-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <div
                                  className="p-2 rounded-full"
                                  style={{ backgroundColor: (category?.color || '#000000') + '20' }}
                                >
                                  <Icon
                                    className="h-4 w-4"
                                    style={{ color: category?.color || '#000000' }}
                                  />
                                </div>
                                <div>
                                  <p className="font-medium">
                                    {expense.description || category?.name || 'Unknown'}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    {category?.name || 'Unknown'}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center space-x-3">
                                <p className="font-bold">
                                  {formatCurrency(expense.amount)}
                                </p>

                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm">
                                      <MoreVertical className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem>
                                      <Edit2 className="h-4 w-4 mr-2" />
                                      Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => deleteExpense(expense.id)}
                                      className="text-red-600"
                                    >
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                </div>
              )
            })}

          {/* Load More Button */}
          {hasMore && (
            <div className="flex justify-center">
              <Button
                variant="outline"
                onClick={loadMore}
                disabled={loading}
              >
                {loading ? 'Loading...' : 'Load More'}
              </Button>
            </div>
          )}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Search className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No expenses found</h3>
            <p className="text-muted-foreground text-center mb-4">
              {searchQuery || selectedCategory || dateFilter !== 'current-month'
                ? 'Try adjusting your filters to see more results.'
                : 'Start by adding your first expense to track your spending.'
              }
            </p>
            <Button asChild>
              <Link href="/add-expense">
                <PlusCircle className="h-4 w-4 mr-2" />
                Add Expense
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}