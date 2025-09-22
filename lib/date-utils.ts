import { format, startOfMonth, endOfMonth, subMonths, isToday, isYesterday } from 'date-fns'

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date

  if (isToday(d)) return 'Today'
  if (isYesterday(d)) return 'Yesterday'

  return format(d, 'MMM d, yyyy')
}

export function formatDateShort(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return format(d, 'MMM d')
}

export function getCurrentMonthRange() {
  const now = new Date()
  return {
    start: startOfMonth(now),
    end: endOfMonth(now)
  }
}

export function getLastMonthRange() {
  const lastMonth = subMonths(new Date(), 1)
  return {
    start: startOfMonth(lastMonth),
    end: endOfMonth(lastMonth)
  }
}

export function getLast7DaysRange() {
  const now = new Date()
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  return {
    start: sevenDaysAgo,
    end: now
  }
}

export function getTodayRange() {
  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)
  return {
    start: startOfToday,
    end: endOfToday
  }
}

export function getYesterdayRange() {
  const now = new Date()
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)
  const startOfYesterday = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate())
  const endOfYesterday = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 23, 59, 59)
  return {
    start: startOfYesterday,
    end: endOfYesterday
  }
}