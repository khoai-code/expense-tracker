'use client'

import { useCurrency, CURRENCIES } from '@/contexts/currency-context'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { ChevronDown, DollarSign } from 'lucide-react'

export function CurrencySelector() {
  const { currency, setCurrency } = useCurrency()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <DollarSign className="h-4 w-4" />
          {currency.code}
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[200px]">
        {CURRENCIES.map((curr) => (
          <DropdownMenuItem
            key={curr.code}
            onClick={() => setCurrency(curr)}
            className={`flex items-center justify-between cursor-pointer ${
              currency.code === curr.code ? 'bg-primary/10' : ''
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="font-medium">{curr.symbol}</span>
              <span>{curr.code}</span>
            </div>
            <span className="text-sm text-muted-foreground">{curr.name}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}