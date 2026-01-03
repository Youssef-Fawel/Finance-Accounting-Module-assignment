import { getAuthenticatedUser } from '@/lib/auth'
import { getTransactions, getFinancialSummary, createTransaction } from '@/lib/finance'

// Mock Supabase
jest.mock('@/lib/supabase', () => ({
  supabaseAdmin: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(),
        })),
      })),
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(),
        })),
      })),
    })),
  },
}))

describe('Tenant Isolation', () => {
  const mockTenant1User = {
    id: 'user-1',
    email: 'user1@tenant1.com',
    tenant_id: 'tenant-1',
    role: 'treasurer' as const,
  }

  const mockTenant2User = {
    id: 'user-2',
    email: 'user2@tenant2.com',
    tenant_id: 'tenant-2',
    role: 'treasurer' as const,
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('User from Tenant A cannot read Tenant B transactions', async () => {
    // User from Tenant 1 tries to access Tenant 2 data
    const userFromTenant1 = mockTenant1User
    const tenant2Id = 'tenant-2'

    // This should throw an error
    await expect(
      getTransactions(userFromTenant1, tenant2Id)
    ).rejects.toThrow(/Access denied.*cross-tenant access/i)
  })

  test('User from Tenant A cannot create transaction for Tenant B', async () => {
    // User from Tenant 1 tries to create transaction for Tenant 2
    const userFromTenant1 = mockTenant1User
    const tenant2Id = 'tenant-2'

    const transactionData = {
      type: 'income' as const,
      amount: 100,
      category: 'Test',
      description: 'Attempt to create in another tenant',
    }

    // This should throw an error
    await expect(
      createTransaction(userFromTenant1, tenant2Id, transactionData)
    ).rejects.toThrow(/Access denied.*cross-tenant access/i)
  })

  test('User from Tenant A cannot access Tenant B financial summary', async () => {
    // User from Tenant 1 tries to get Tenant 2 summary
    const userFromTenant1 = mockTenant1User
    const tenant2Id = 'tenant-2'

    // This should throw an error
    await expect(
      getFinancialSummary(userFromTenant1, tenant2Id)
    ).rejects.toThrow(/Access denied.*cross-tenant access/i)
  })

  test('User can only access their own tenant data', async () => {
    const { supabaseAdmin } = require('@/lib/supabase')

    // Mock successful query for user's own tenant
    supabaseAdmin.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({
            data: [
              {
                id: 'trans-1',
                tenant_id: 'tenant-1',
                type: 'income',
                amount: 100,
                category: 'Test',
              },
            ],
            error: null,
          }),
        }),
      }),
    })

    const userFromTenant1 = mockTenant1User
    const result = await getTransactions(userFromTenant1, 'tenant-1')

    // Should successfully retrieve transactions
    expect(result).toHaveLength(1)
    expect(result[0].tenant_id).toBe('tenant-1')
  })
})
