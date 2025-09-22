'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/contexts/auth-context'
import { supabase } from '@/lib/supabase'
import { useCurrency } from '@/contexts/currency-context'
import { checkBudgetStatus } from '@/lib/budget-notifications'
import { toast } from 'sonner'
import { PlusCircle, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Category {
  id: string
  name: string
  color: string
  icon_name: string
  emoji: string
}

export default function AddExpensePage() {
  const { user } = useAuth()
  const { formatCurrency, convertToCents, currency } = useCurrency()
  const router = useRouter()
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [addAnother, setAddAnother] = useState(false)

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('display_order')

      if (error) throw error
      setCategories(data || [])

      // Auto-select first category
      if (data && data.length > 0) {
        setSelectedCategory(data[0].id)
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
      toast.error('Failed to load categories')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !selectedCategory || !amount) return

    setIsSubmitting(true)

    try {
      const numericAmount = parseFloat(amount)
      if (isNaN(numericAmount) || numericAmount <= 0) {
        toast.error('Please enter a valid amount')
        return
      }

      const amountInCents = convertToCents(numericAmount)

      const { error } = await supabase
        .from('expenses')
        .insert({
          user_id: user.id,
          category_id: selectedCategory,
          amount: amountInCents,
          description: description.trim() || null,
          expense_date: date
        })

      if (error) throw error

      toast.success('Expense added successfully!')

      // Check budget status and show notifications
      await checkBudgetStatus(user.id, selectedCategory)

      if (addAnother) {
        // Reset form but keep category and date
        setAmount('')
        setDescription('')
      } else {
        router.push('/dashboard')
      }
    } catch (error) {
      console.error('Error adding expense:', error)
      toast.error('Failed to add expense')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAmountChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    // Allow only numbers, decimal point, and basic currency formatting
    const numericValue = value.replace(/[^0-9.]/g, '')
    setAmount(numericValue)
  }, [])

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Add Expense</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Expense Entry</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Amount Input */}
            <div className="space-y-2">
              <Label htmlFor="amount">Amount *</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                  {currency.symbol}
                </span>
                <Input
                  id="amount"
                  type="text"
                  inputMode="decimal"
                  placeholder={currency.code === 'VND' ? '1000' : currency.code === 'THB' ? '100' : '10.00'}
                  value={amount}
                  onChange={handleAmountChange}
                  className="pl-8 text-lg"
                  required
                />
              </div>
              {amount && (
                <p className="text-sm text-muted-foreground">
                  Preview: {formatCurrency(convertToCents(parseFloat(amount) || 0))}
                </p>
              )}
            </div>

            {/* Category Selection */}
            <div className="space-y-3">
              <Label>Category *</Label>
              <div className="grid grid-cols-3 gap-3">
                {categories.map((category) => {
                  const isSelected = selectedCategory === category.id

                  return (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => setSelectedCategory(category.id)}
                      className={cn(
                        'relative p-4 rounded-xl border-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 hover:scale-105',
                        isSelected
                          ? 'border-primary bg-primary/10 shadow-lg'
                          : 'border-border/50 hover:border-primary/50 hover:bg-muted/50'
                      )}
                    >
                      <div className="flex flex-col items-center space-y-2">
                        <div
                          className="w-12 h-12 rounded-full flex items-center justify-center text-2xl shadow-sm"
                          style={{ backgroundColor: category.color + '15' }}
                        >
                          {category.emoji}
                        </div>
                        <span className="text-sm font-medium text-center leading-tight">
                          {category.name}
                        </span>
                      </div>
                      {isSelected && (
                        <div className="absolute -top-1 -right-1">
                          <div className="bg-primary rounded-full p-1.5 shadow-lg">
                            <Check className="h-3 w-3 text-primary-foreground" />
                          </div>
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Description Input */}
            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Input
                id="description"
                type="text"
                placeholder="What was this expense for?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={200}
              />
            </div>

            {/* Date Input */}
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                required
              />
            </div>

            {/* Add Another Checkbox */}
            <div className="flex items-center space-x-2">
              <input
                id="add-another"
                type="checkbox"
                checked={addAnother}
                onChange={(e) => setAddAnother(e.target.checked)}
                className="rounded border-gray-300 text-primary focus:ring-primary"
              />
              <Label htmlFor="add-another" className="text-sm">
                Add another expense after this one
              </Label>
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-3">
              <Button
                type="submit"
                disabled={isSubmitting || !amount || !selectedCategory}
                className="flex-1"
              >
                {isSubmitting ? (
                  'Adding...'
                ) : (
                  <>
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Add Expense
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/dashboard')}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            ⚡ Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" size="sm" className="flex items-center gap-2 hover:scale-105 transition-transform" onClick={() => {
              const amount = currency.code === 'VND' ? '120000' : currency.code === 'THB' ? '180' : '5.00'
              setAmount(amount)
              setSelectedCategory(categories.find(c => c.name === 'Food & Dining')?.id || selectedCategory)
            }}>
              ☕ Coffee - {currency.symbol}{currency.code === 'VND' ? '120k' : currency.code === 'THB' ? '180' : '5'}
            </Button>
            <Button variant="outline" size="sm" className="flex items-center gap-2 hover:scale-105 transition-transform" onClick={() => {
              const amount = currency.code === 'VND' ? '300000' : currency.code === 'THB' ? '400' : '12.00'
              setAmount(amount)
              setSelectedCategory(categories.find(c => c.name === 'Food & Dining')?.id || selectedCategory)
            }}>
              🍽️ Lunch - {currency.symbol}{currency.code === 'VND' ? '300k' : currency.code === 'THB' ? '400' : '12'}
            </Button>
            <Button variant="outline" size="sm" className="flex items-center gap-2 hover:scale-105 transition-transform" onClick={() => {
              const amount = currency.code === 'VND' ? '50000' : currency.code === 'THB' ? '150' : '8.00'
              setAmount(amount)
              setSelectedCategory(categories.find(c => c.name === 'Transportation')?.id || selectedCategory)
            }}>
              🚗 Transit - {currency.symbol}{currency.code === 'VND' ? '50k' : currency.code === 'THB' ? '150' : '8'}
            </Button>
            <Button variant="outline" size="sm" className="flex items-center gap-2 hover:scale-105 transition-transform" onClick={() => {
              const amount = currency.code === 'VND' ? '400000' : currency.code === 'THB' ? '500' : '15.00'
              setAmount(amount)
              setSelectedCategory(categories.find(c => c.name === 'Entertainment')?.id || selectedCategory)
            }}>
              🎬 Movie - {currency.symbol}{currency.code === 'VND' ? '400k' : currency.code === 'THB' ? '500' : '15'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}