'use client'

import { createContext, useContext, useState, useEffect } from 'react'

export interface Currency {
  code: string
  symbol: string
  name: string
  rate: number // Rate compared to USD
}

export const CURRENCIES: Currency[] = [
  { code: 'USD', symbol: '$', name: 'US Dollar', rate: 1 },
  { code: 'VND', symbol: '₫', name: 'Vietnamese Dong', rate: 24000 },
  { code: 'THB', symbol: '฿', name: 'Thai Baht', rate: 36 },
]

interface CurrencyContextType {
  currency: Currency
  setCurrency: (currency: Currency) => void
  convertFromCents: (cents: number) => number
  convertToCents: (amount: number) => number
  formatCurrency: (cents: number) => string
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined)

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = useState<Currency>(CURRENCIES[0]) // Default to USD

  useEffect(() => {
    // Load saved currency from localStorage
    const savedCurrency = localStorage.getItem('expense-tracker-currency')
    if (savedCurrency) {
      const found = CURRENCIES.find(c => c.code === savedCurrency)
      if (found) {
        setCurrencyState(found)
      }
    }
  }, [])

  const setCurrency = (newCurrency: Currency) => {
    setCurrencyState(newCurrency)
    localStorage.setItem('expense-tracker-currency', newCurrency.code)
  }

  const convertFromCents = (cents: number): number => {
    // Convert from USD cents to current currency
    const usdAmount = cents / 100
    return Math.round(usdAmount * currency.rate)
  }

  const convertToCents = (amount: number): number => {
    // Convert from current currency to USD cents
    const usdAmount = amount / currency.rate
    return Math.round(usdAmount * 100)
  }

  const formatCurrency = (cents: number): string => {
    const amount = convertFromCents(cents)

    if (currency.code === 'VND') {
      return `${amount.toLocaleString('vi-VN')}${currency.symbol}`
    } else if (currency.code === 'THB') {
      return `${currency.symbol}${amount.toLocaleString('th-TH')}`
    } else {
      return `${currency.symbol}${(amount).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })}`
    }
  }

  const value = {
    currency,
    setCurrency,
    convertFromCents,
    convertToCents,
    formatCurrency,
  }

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  )
}

export function useCurrency() {
  const context = useContext(CurrencyContext)
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider')
  }
  return context
}