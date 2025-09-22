export function formatCurrency(amountInCents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amountInCents / 100)
}

export function parseCurrency(value: string): number {
  const numericValue = parseFloat(value.replace(/[^0-9.-]+/g, ''))
  return Math.round(numericValue * 100)
}

export function formatCompactCurrency(amountInCents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: 'compact',
  }).format(amountInCents / 100)
}