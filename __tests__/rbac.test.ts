import { requireWritePermission, requireReadPermission } from '@/lib/rbac'
import { createTransaction } from '@/lib/finance'

// Mock Supabase
jest.mock('@/lib/supabase', () => ({
  supabaseAdmin: {
    from: jest.fn(() => ({
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(),
        })),
      })),
    })),
  },
}))

describe('RBAC Enforcement', () => {
  const mockTreasurer = {
    id: 'treasurer-1',
    email: 'treasurer@club.com',
    tenant_id: 'tenant-1',
    role: 'treasurer' as const,
  }

  const mockViewer = {
    id: 'viewer-1',
    email: 'viewer@club.com',
    tenant_id: 'tenant-1',
    role: 'viewer' as const,
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('Viewer cannot create transaction (lacks write permission)', async () => {
    const transactionData = {
      type: 'income' as const,
      amount: 100,
      category: 'Membership',
      description: 'Test transaction',
    }

    // Viewer tries to create transaction
    await expect(
      createTransaction(mockViewer, 'tenant-1', transactionData)
    ).rejects.toThrow(/Access denied.*does not have 'write' permission/i)
  })

  test('Treasurer can create transaction (has write permission)', async () => {
    const { supabaseAdmin } = require('@/lib/supabase')

    // Mock successful insert
    supabaseAdmin.from.mockReturnValue({
      insert: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: {
              id: 'trans-1',
              tenant_id: 'tenant-1',
              type: 'income',
              amount: 100,
              category: 'Membership',
              description: 'Test transaction',
              date: '2026-01-03',
              created_by: 'treasurer-1',
            },
            error: null,
          }),
        }),
      }),
    })

    const transactionData = {
      type: 'income' as const,
      amount: 100,
      category: 'Membership',
      description: 'Test transaction',
    }

    // Treasurer creates transaction - should succeed
    const result = await createTransaction(mockTreasurer, 'tenant-1', transactionData)

    expect(result).toBeDefined()
    expect(result.type).toBe('income')
    expect(result.amount).toBe(100)
  })

  test('Viewer can read transactions (has read permission)', () => {
    // Should not throw error
    expect(() => requireReadPermission(mockViewer)).not.toThrow()
  })

  test('Treasurer can read transactions (has read permission)', () => {
    // Should not throw error
    expect(() => requireReadPermission(mockTreasurer)).not.toThrow()
  })

  test('Write permission check throws for viewer', () => {
    expect(() => requireWritePermission(mockViewer)).toThrow(/does not have 'write' permission/i)
  })

  test('Write permission check passes for treasurer', () => {
    expect(() => requireWritePermission(mockTreasurer)).not.toThrow()
  })

  test('Invalid role is rejected', () => {
    const invalidUser = {
      id: 'user-1',
      email: 'user@club.com',
      tenant_id: 'tenant-1',
      role: 'admin' as any, // Invalid role
    }

    expect(() => requireReadPermission(invalidUser)).toThrow(/Invalid role/i)
  })
})
