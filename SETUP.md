# Expense Tracker - Setup Instructions

## Prerequisites

- Node.js 18+ installed
- A Supabase account (free tier available)

## Setup Steps

### 1. Install Dependencies

```bash
npm install
```

### 2. Set up Supabase

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the project to be ready (usually takes 2-3 minutes)
3. Go to Project Settings > API to get your project URL and anon key

### 3. Configure Environment Variables

1. Copy the `.env.local` file and update with your Supabase credentials:

```bash
# Replace with your actual Supabase project URL and keys
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 4. Set up Database Schema

1. In your Supabase project, go to SQL Editor
2. Copy and paste the contents of `supabase/schema.sql`
3. Run the SQL to create tables, indexes, and seed data

### 5. Run the Application

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Features

### ✅ Completed Features

- **User Authentication**: Email/password signup and login with Supabase Auth
- **Expense Entry**: Quick 10-second expense entry with category selection
- **Category System**: 9 pre-defined categories with icons and colors
- **Expense List**: View, search, and filter expenses by category and date
- **Budget Management**: Set monthly budgets and track progress
- **Dashboard**: Overview of spending with budget progress indicators
- **Mobile Responsive**: Works on all device sizes
- **Profile Management**: Basic user profile and account management

### 🔄 Remaining Features

- **Analytics Charts**: Add recharts for spending visualizations
- **Onboarding Flow**: Guide new users through initial budget setup
- **Budget Notifications**: Toast alerts when approaching budget limits
- **Export Functionality**: Export expenses to CSV/PDF

## Database Schema

The app uses three main tables:

- `categories`: Pre-defined expense categories
- `expenses`: User expense records
- `budgets`: User budget settings per category

All tables have Row Level Security (RLS) enabled to ensure users only access their own data.

## Tech Stack

- **Frontend**: Next.js 14 with App Router, TypeScript
- **UI**: shadcn/ui components with Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Icons**: Lucide React
- **Charts**: Recharts (to be added)
- **Forms**: React Hook Form with Zod validation (to be added)

## File Structure

```
expense-tracker/
├── app/                          # Next.js App Router pages
│   ├── (dashboard)/             # Protected dashboard routes
│   │   ├── dashboard/           # Main dashboard
│   │   ├── add-expense/         # Expense entry
│   │   ├── expenses/            # Expense list
│   │   ├── budgets/             # Budget management
│   │   └── profile/             # User profile
│   ├── layout.tsx               # Root layout with auth provider
│   └── page.tsx                 # Login/signup page
├── components/                   # Reusable components
│   ├── ui/                      # shadcn/ui components
│   ├── auth-guard.tsx           # Authentication protection
│   └── layout/                  # Layout components
├── contexts/                     # React contexts
│   └── auth-context.tsx         # Authentication context
├── lib/                         # Utility functions
│   ├── supabase.ts              # Supabase client and types
│   ├── categories.ts            # Category definitions
│   ├── currency.ts              # Currency formatting
│   ├── date-utils.ts            # Date utilities
│   └── utils.ts                 # General utilities
└── supabase/                    # Database files
    └── schema.sql               # Database schema and seed data
```

## Development Notes

- All monetary amounts are stored as integers (cents) to avoid floating-point issues
- The app is mobile-first responsive design
- Row Level Security ensures data privacy
- Form validation prevents negative amounts and invalid dates
- Expense entry is optimized for speed (target: under 10 seconds)

## Next Steps

1. Add charts to dashboard for better data visualization
2. Implement onboarding flow for new users
3. Add budget notification system
4. Create export functionality
5. Add recurring expense tracking (future enhancement)