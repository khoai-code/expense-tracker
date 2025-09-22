import {
  UtensilsCrossed,
  Car,
  ShoppingBag,
  Gamepad2,
  Zap,
  Heart,
  ShoppingCart,
  Sparkles,
  MoreHorizontal,
  LucideIcon
} from 'lucide-react'

export interface Category {
  id: string
  name: string
  color: string
  icon_name: string
  emoji: string
  display_order: number
}

export const DEFAULT_CATEGORIES: Omit<Category, 'id'>[] = [
  {
    name: 'Food & Dining',
    color: '#ef4444',
    icon_name: 'UtensilsCrossed',
    emoji: '🍽️',
    display_order: 1
  },
  {
    name: 'Transportation',
    color: '#3b82f6',
    icon_name: 'Car',
    emoji: '🚗',
    display_order: 2
  },
  {
    name: 'Shopping',
    color: '#8b5cf6',
    icon_name: 'ShoppingBag',
    emoji: '🛍️',
    display_order: 3
  },
  {
    name: 'Entertainment',
    color: '#f59e0b',
    icon_name: 'Gamepad2',
    emoji: '🎮',
    display_order: 4
  },
  {
    name: 'Bills & Utilities',
    color: '#10b981',
    icon_name: 'Zap',
    emoji: '⚡',
    display_order: 5
  },
  {
    name: 'Healthcare',
    color: '#ec4899',
    icon_name: 'Heart',
    emoji: '🏥',
    display_order: 6
  },
  {
    name: 'Groceries',
    color: '#84cc16',
    icon_name: 'ShoppingCart',
    emoji: '🛒',
    display_order: 7
  },
  {
    name: 'Personal Care',
    color: '#06b6d4',
    icon_name: 'Sparkles',
    emoji: '💅',
    display_order: 8
  },
  {
    name: 'Other',
    color: '#6b7280',
    icon_name: 'MoreHorizontal',
    emoji: '📦',
    display_order: 9
  }
]

export const CATEGORY_ICONS: Record<string, LucideIcon> = {
  UtensilsCrossed,
  Car,
  ShoppingBag,
  Gamepad2,
  Zap,
  Heart,
  ShoppingCart,
  Sparkles,
  MoreHorizontal
}

export function getCategoryIcon(iconName: string): LucideIcon {
  return CATEGORY_ICONS[iconName] || MoreHorizontal
}