import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Debug logging for production
if (typeof window !== 'undefined') {
  console.log('Supabase Config Check:', {
    url: supabaseUrl ? 'Set' : 'Missing',
    key: supabaseKey ? 'Set' : 'Missing',
    urlValue: supabaseUrl
  })
}

export const supabase = createClient(supabaseUrl, supabaseKey)

export type Database = {
  public: {
    Tables: {
      categories: {
        Row: {
          id: string
          name: string
          color: string
          icon_name: string
          emoji: string
          display_order: number
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          color: string
          icon_name: string
          emoji?: string
          display_order: number
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          color?: string
          icon_name?: string
          emoji?: string
          display_order?: number
          created_at?: string
        }
      }
      budgets: {
        Row: {
          id: string
          user_id: string
          category_id: string
          monthly_limit: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          category_id: string
          monthly_limit: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          category_id?: string
          monthly_limit?: number
          created_at?: string
          updated_at?: string
        }
      }
      expenses: {
        Row: {
          id: string
          user_id: string
          category_id: string
          amount: number
          description: string | null
          expense_date: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          category_id: string
          amount: number
          description?: string | null
          expense_date?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          category_id?: string
          amount?: number
          description?: string | null
          expense_date?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}