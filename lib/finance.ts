import { supabaseAdmin } from './supabase'
import { User, verifyTenantOwnership } from './auth'
import { requireWritePermission, requireReadPermission } from './rbac'
import { z } from 'zod'

export const TransactionInputSchema = z.object({
  type: z.enum(['income', 'expense'], {
    errorMap: () => ({ message: "Type must be 'income' or 'expense'" }),
  }),
  amount: z
    .number()
    .positive({ message: 'Amount must be greater than 0' })
    .finite({ message: 'Amount must be a finite number' })
    .refine((val) => Number(val.toFixed(2)) === val, {
      message: 'Amount must have at most 2 decimal places',
    }),
  category: z
    .string()
    .min(1, { message: 'Category is required' })
    .max(100, { message: 'Category must be less than 100 characters' })
    .refine((val) => val.trim().length > 0, {
      message: 'Category cannot be only whitespace',
    }),
  description: z
    .string()
    .max(500, { message: 'Description must be less than 500 characters' })
    .optional(),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, {
      message: 'Date must be in YYYY-MM-DD format',
    })
    .optional(),
})

export type TransactionInput = z.infer<typeof TransactionInputSchema>

export interface Transaction {
  id: string
  tenant_id: string
  type: 'income' | 'expense'
  amount: number
  category: string
  description: string | null
  date: string
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface FinancialSummary {
  totalIncome: number
  totalExpense: number
  balance: number
  transactionCount: number
}

export async function createTransaction(
  user: User,
  tenantId: string,
  data: TransactionInput
): Promise<Transaction> {
  requireWritePermission(user)
  verifyTenantOwnership(user, tenantId)

  const validatedData = TransactionInputSchema.parse(data)

  const transactionData = {
    tenant_id: tenantId,
    type: validatedData.type,
    amount: validatedData.amount,
    category: validatedData.category.trim(),
    description: validatedData.description?.trim() || null,
    date: validatedData.date || new Date().toISOString().split('T')[0],
    created_by: user.id,
  }

  // Insert into database
  const { data: transaction, error } = await supabaseAdmin
    .from('transactions')
    .insert(transactionData)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create transaction: ${error.message}`)
  }

  return transaction as Transaction
}

export async function getTransactions(
  user: User,
  tenantId: string
): Promise<Transaction[]> {
  requireReadPermission(user)
  verifyTenantOwnership(user, tenantId)

  const { data: transactions, error } = await supabaseAdmin
    .from('transactions')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('date', { ascending: false })

  if (error) {
    throw new Error(`Failed to retrieve transactions: ${error.message}`)
  }

  return (transactions || []) as Transaction[]
}

/**
 * Get financial summary for a tenant
 * 
 * This function:
 * 1. Validates user has read permission
 * 2. Verifies tenant ownership
 * 3. Computes total income, total expense, and balance
 * 
 * Calculation logic:
 * - totalIncome = SUM(amount WHERE type = 'income')
 * - totalExpense = SUM(amount WHERE type = 'expense')
 * - balance = totalIncome - totalExpense
 * 
 * Security checks:
 * - User must be authenticated
 * - User must belong to the target tenant
 * - User must have 'read' permission
 * 
 * @param user - Authenticated user
 * @param tenantId - ID of the tenant
 * @returns Financial summary
 */
export async function getFinancialSummary(
  user: User,
  tenantId: string
): Promise<FinancialSummary> {
  requireReadPermission(user)
  verifyTenantOwnership(user, tenantId)


  const { data: transactions, error } = await supabaseAdmin
    .from('transactions')
    .select('type, amount')
    .eq('tenant_id', tenantId)

  if (error) {
    throw new Error(`Failed to retrieve transactions for summary: ${error.message}`)
  }


  let totalIncome = 0
  let totalExpense = 0

  for (const transaction of transactions || []) {
    const amount = parseFloat(String(transaction.amount))
    
    if (transaction.type === 'income') {
      totalIncome += amount
    } else if (transaction.type === 'expense') {
      totalExpense += amount
    }
  }

  // Round to 2 decimal places to avoid floating point errors
  totalIncome = Math.round(totalIncome * 100) / 100
  totalExpense = Math.round(totalExpense * 100) / 100
  const balance = Math.round((totalIncome - totalExpense) * 100) / 100

  return {
    totalIncome,
    totalExpense,
    balance,
    transactionCount: transactions?.length || 0,
  }
}
