import { getFinancialSummary } from '@/lib/finance'

// Mock Supabase
jest.mock('@/lib/supabase', () => ({
  supabaseAdmin: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(),
      })),
    })),
  },
}))

describe('Financial Calculations', () => {
  const mockUser = {
    id: 'user-1',
    email: 'user@club.com',
    tenant_id: 'tenant-1',
    role: 'treasurer' as const,
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('Correctly calculates balance: Income - Expense', async () => {
    const { supabaseAdmin } = require('@/lib/supabase')

    // Mock transactions: 500 income, 150 expense = 350 balance
    supabaseAdmin.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({
          data: [
            { type: 'income', amount: 500 },
            { type: 'expense', amount: 150 },
          ],
          error: null,
        }),
      }),
    })

    const summary = await getFinancialSummary(mockUser, 'tenant-1')

    expect(summary.totalIncome).toBe(500)
    expect(summary.totalExpense).toBe(150)
    expect(summary.balance).toBe(350)
    expect(summary.transactionCount).toBe(2)
  })

  test('Correctly sums multiple income transactions', async () => {
    const { supabaseAdmin } = require('@/lib/supabase')

    // Multiple income transactions
    supabaseAdmin.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({
          data: [
            { type: 'income', amount: 100 },
            { type: 'income', amount: 200 },
            { type: 'income', amount: 50.50 },
          ],
          error: null,
        }),
      }),
    })

    const summary = await getFinancialSummary(mockUser, 'tenant-1')

    expect(summary.totalIncome).toBe(350.5)
    expect(summary.totalExpense).toBe(0)
    expect(summary.balance).toBe(350.5)
  })

  test('Correctly sums multiple expense transactions', async () => {
    const { supabaseAdmin } = require('@/lib/supabase')

    // Multiple expense transactions
    supabaseAdmin.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({
          data: [
            { type: 'expense', amount: 75 },
            { type: 'expense', amount: 25.50 },
            { type: 'expense', amount: 100 },
          ],
          error: null,
        }),
      }),
    })

    const summary = await getFinancialSummary(mockUser, 'tenant-1')

    expect(summary.totalIncome).toBe(0)
    expect(summary.totalExpense).toBe(200.5)
    expect(summary.balance).toBe(-200.5)
  })

  test('Handles empty tenant (no transactions)', async () => {
    const { supabaseAdmin } = require('@/lib/supabase')

    // No transactions
    supabaseAdmin.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      }),
    })

    const summary = await getFinancialSummary(mockUser, 'tenant-1')

    expect(summary.totalIncome).toBe(0)
    expect(summary.totalExpense).toBe(0)
    expect(summary.balance).toBe(0)
    expect(summary.transactionCount).toBe(0)
  })

  test('Rounds amounts to 2 decimal places', async () => {
    const { supabaseAdmin } = require('@/lib/supabase')

    // Transactions with many decimal places
    supabaseAdmin.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({
          data: [
            { type: 'income', amount: 100.333 },
            { type: 'expense', amount: 50.667 },
          ],
          error: null,
        }),
      }),
    })

    const summary = await getFinancialSummary(mockUser, 'tenant-1')

    // Should round correctly
    expect(summary.totalIncome).toBe(100.33)
    expect(summary.totalExpense).toBe(50.67)
    expect(summary.balance).toBe(49.66)
  })

  test('Handles negative balance correctly', async () => {
    const { supabaseAdmin } = require('@/lib/supabase')

    // More expenses than income
    supabaseAdmin.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({
          data: [
            { type: 'income', amount: 100 },
            { type: 'expense', amount: 200 },
          ],
          error: null,
        }),
      }),
    })

    const summary = await getFinancialSummary(mockUser, 'tenant-1')

    expect(summary.totalIncome).toBe(100)
    expect(summary.totalExpense).toBe(200)
    expect(summary.balance).toBe(-100)
  })

  test('Handles large amounts correctly', async () => {
    const { supabaseAdmin } = require('@/lib/supabase')

    // Large amounts (millions)
    supabaseAdmin.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({
          data: [
            { type: 'income', amount: 1000000 },
            { type: 'expense', amount: 500000.50 },
          ],
          error: null,
        }),
      }),
    })

    const summary = await getFinancialSummary(mockUser, 'tenant-1')

    expect(summary.totalIncome).toBe(1000000)
    expect(summary.totalExpense).toBe(500000.5)
    expect(summary.balance).toBe(499999.5)
  })
})
