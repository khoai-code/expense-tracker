'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'
import { useCurrency } from '@/contexts/currency-context'
import { memo, useMemo } from 'react'

interface ExpenseData {
  name: string
  value: number
  color: string
  emoji: string
  percentage: number
  [key: string]: string | number
}

interface ExpensePieChartProps {
  data: Array<{
    category_name: string
    category_emoji: string
    total: number
    color: string
  }>
}

function ExpensePieChartComponent({ data }: ExpensePieChartProps) {
  const { formatCurrency } = useCurrency()

  // Memoize calculations to avoid recalculating on every render
  const chartData: ExpenseData[] = useMemo(() => {
    // Calculate total and percentages
    const total = data.reduce((sum, item) => sum + item.total, 0)

    return data
      .filter(item => item.total > 0)
      .map(item => ({
        name: item.category_name,
        value: item.total,
        color: item.color,
        emoji: item.category_emoji,
        percentage: total > 0 ? (item.total / total) * 100 : 0
      }))
      .sort((a, b) => b.value - a.value) // Sort by amount descending
  }, [data])

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: { payload: ExpenseData }[] }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">{data.emoji}</span>
            <span className="font-medium">{data.name}</span>
          </div>
          <div className="text-sm text-muted-foreground">
            <div>{formatCurrency(data.value)}</div>
            <div>{data.percentage.toFixed(1)}% of total</div>
          </div>
        </div>
      )
    }
    return null
  }


  const CustomLegend = ({ payload }: { payload?: Array<{ color: string; value: string; payload: ExpenseData }> }) => {
    return (
      <div className="flex flex-wrap justify-center gap-4 mt-4">
        {payload?.map((entry, index: number) => (
          <div key={index} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-sm">
              {entry.payload.emoji} {entry.value}
            </span>
            <span className="text-xs text-muted-foreground">
              {entry.payload.percentage.toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    )
  }

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        <div className="text-center">
          <div className="text-4xl mb-2">📊</div>
          <div>No expenses this month</div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={false}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
            animationDuration={800}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend content={<CustomLegend />} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}

export const ExpensePieChart = memo(ExpensePieChartComponent)