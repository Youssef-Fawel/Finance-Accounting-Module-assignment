'use client'

import { useState, useEffect } from 'react'

interface Transaction {
  id: string
  type: 'income' | 'expense'
  amount: number
  category: string
  description: string | null
  date: string
}

interface FinancialSummary {
  totalIncome: number
  totalExpense: number
  balance: number
  transactionCount: number
}

// Predefined categories for income and expenses
const INCOME_CATEGORIES = [
  'Membership Fees',
  'Sponsorship',
  'Donations',
  'Event Revenue',
  'Merchandise Sales',
  'Registration Fees',
  'Grants',
  'Other Income',
]

const EXPENSE_CATEGORIES = [
  'Equipment',
  'Facility Rental',
  'Utilities',
  'Salaries & Wages',
  'Insurance',
  'Marketing & Advertising',
  'Office Supplies',
  'Maintenance & Repairs',
  'Event Costs',
  'Transportation',
  'Professional Fees',
  'Other Expense',
]

export default function Home() {
  // Hardcoded user/tenant for demo (in production, use real auth)
  const userId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' // Treasurer of Tennis Club
  const tenantId = '11111111-1111-1111-1111-111111111111' // Tennis Club Paris

  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [summary, setSummary] = useState<FinancialSummary | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    type: 'income' as 'income' | 'expense',
    amount: '',
    category: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
  })

  // Fetch transactions and summary on mount
  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    setError(null)

    try {
      // Fetch transactions
      const transactionsRes = await fetch(
        `/api/transactions?tenantId=${tenantId}`,
        {
          headers: {
            Authorization: `Bearer ${userId}`,
          },
        }
      )

      if (!transactionsRes.ok) {
        const error = await transactionsRes.json()
        throw new Error(error.error || 'Failed to fetch transactions')
      }

      const transactionsData = await transactionsRes.json()
      setTransactions(transactionsData.data)

      // Fetch summary
      const summaryRes = await fetch(`/api/summary?tenantId=${tenantId}`, {
        headers: {
          Authorization: `Bearer ${userId}`,
        },
      })

      if (!summaryRes.ok) {
        const error = await summaryRes.json()
        throw new Error(error.error || 'Failed to fetch summary')
      }

      const summaryData = await summaryRes.json()
      setSummary(summaryData.data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userId}`,
        },
        body: JSON.stringify({
          tenantId,
          type: formData.type,
          amount: parseFloat(formData.amount),
          category: formData.category,
          description: formData.description || undefined,
          date: formData.date,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create transaction')
      }

      // Reset form
      setFormData({
        type: 'income',
        amount: '',
        category: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
      })

      // Refresh data
      await fetchData()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', padding: '40px 20px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header Card */}
        <div style={{ 
          background: 'white', 
          borderRadius: '16px', 
          padding: '30px',
          marginBottom: '30px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.07)'
        }}>
          <h1 style={{ marginBottom: '12px' }}>Finance & Accounting Module</h1>
          <p style={{ color: '#718096', fontSize: '15px' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ 
                background: '#667eea', 
                color: 'white', 
                padding: '4px 12px', 
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: '600'
              }}>Tennis Club Paris</span>
              <span>•</span>
              <strong>treasurer@tennis.com</strong>
              <span style={{ 
                background: '#10b981', 
                color: 'white', 
                padding: '4px 12px', 
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: '600'
              }}>Treasurer</span>
            </span>
          </p>
        </div>

        {error && (
          <div style={{ 
            padding: '16px 20px', 
            backgroundColor: '#fee2e2', 
            border: '1px solid #fca5a5', 
            borderRadius: '12px',
            marginBottom: '24px',
            color: '#991b1b',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <span style={{ fontSize: '20px' }}>⚠️</span>
            <div><strong>Error:</strong> {error}</div>
          </div>
        )}


      {/* Financial Summary */}
      {summary && (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '20px',
          marginBottom: '32px'
        }}>
          <div style={{ 
            padding: '28px', 
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            borderRadius: '16px',
            boxShadow: '0 4px 6px rgba(16, 185, 129, 0.2)',
            color: 'white'
          }}>
            <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '8px', fontWeight: '500' }}>Total Income</div>
            <div style={{ fontSize: '32px', fontWeight: '700', letterSpacing: '-1px' }}>
              €{summary.totalIncome.toFixed(2)}
            </div>
            <div style={{ fontSize: '12px', opacity: 0.8, marginTop: '8px' }}>↗ Revenue</div>
          </div>

          <div style={{ 
            padding: '28px', 
            background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
            borderRadius: '16px',
            boxShadow: '0 4px 6px rgba(239, 68, 68, 0.2)',
            color: 'white'
          }}>
            <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '8px', fontWeight: '500' }}>Total Expense</div>
            <div style={{ fontSize: '32px', fontWeight: '700', letterSpacing: '-1px' }}>
              €{summary.totalExpense.toFixed(2)}
            </div>
            <div style={{ fontSize: '12px', opacity: 0.8, marginTop: '8px' }}>↘ Spending</div>
          </div>

          <div style={{ 
            padding: '28px', 
            background: summary.balance >= 0 
              ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'
              : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            borderRadius: '16px',
            boxShadow: summary.balance >= 0 
              ? '0 4px 6px rgba(59, 130, 246, 0.2)'
              : '0 4px 6px rgba(245, 158, 11, 0.2)',
            color: 'white'
          }}>
            <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '8px', fontWeight: '500' }}>Balance</div>
            <div style={{ fontSize: '32px', fontWeight: '700', letterSpacing: '-1px' }}>
              €{summary.balance.toFixed(2)}
            </div>
            <div style={{ fontSize: '12px', opacity: 0.8, marginTop: '8px' }}>
              {summary.balance >= 0 ? '✓ Positive' : '⚠ Negative'}
            </div>
          </div>
        </div>
      )}

      {/* Add Transaction Form */}
      <div style={{ 
        padding: '25px', 
        backgroundColor: '#f5f5f5', 
        borderRadius: '8px',
        marginBottom: '30px'
      }}>
        <h2>Add Transaction</h2>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                Type *
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as any, category: '' })}
                required
                style={{ 
                  width: '100%', 
                  padding: '10px', 
                  borderRadius: '5px',
                  border: '1px solid #ccc',
                  fontSize: '14px'
                }}
              >
                <option value="income">Income</option>
                <option value="expense">Expense</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                Amount (€) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                required
                placeholder="100.00"
                style={{ 
                  width: '100%', 
                  padding: '10px', 
                  borderRadius: '5px',
                  border: '1px solid #ccc',
                  fontSize: '14px'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                Category *
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                required
                style={{ 
                  width: '100%', 
                  padding: '10px', 
                  borderRadius: '5px',
                  border: '1px solid #ccc',
                  fontSize: '14px',
                  backgroundColor: 'white'
                }}
              >
                <option value="">-- Select Category --</option>
                {formData.type === 'income' 
                  ? INCOME_CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))
                  : EXPENSE_CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))
                }
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                Date *
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
                style={{ 
                  width: '100%', 
                  padding: '10px', 
                  borderRadius: '5px',
                  border: '1px solid #ccc',
                  fontSize: '14px'
                }}
              />
            </div>
          </div>

          <div style={{ marginTop: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Optional details..."
              rows={3}
              style={{ 
                width: '100%', 
                padding: '10px', 
                borderRadius: '5px',
                border: '1px solid #ccc',
                fontSize: '14px',
                fontFamily: 'inherit'
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: '15px',
              padding: '12px 30px',
              backgroundColor: '#2196f3',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              fontSize: '16px',
              fontWeight: '500',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? 'Adding...' : 'Add Transaction'}
          </button>
        </form>
      </div>

      {/* Transactions List */}
      <div>
        <h2>Recent Transactions</h2>
        {loading && <p>Loading...</p>}
        {!loading && transactions.length === 0 && (
          <p style={{ color: '#666' }}>No transactions yet. Add your first transaction above.</p>
        )}
        {!loading && transactions.length > 0 && (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ 
              width: '100%', 
              borderCollapse: 'collapse',
              backgroundColor: 'white',
              borderRadius: '8px',
              overflow: 'hidden'
            }}>
              <thead>
                <tr style={{ backgroundColor: '#f5f5f5' }}>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Date</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Type</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Category</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Description</th>
                  <th style={{ padding: '12px', textAlign: 'right', borderBottom: '2px solid #ddd' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((transaction) => (
                  <tr key={transaction.id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '12px' }}>
                      {new Date(transaction.date).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span style={{
                        padding: '4px 12px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '500',
                        backgroundColor: transaction.type === 'income' ? '#e8f5e9' : '#ffebee',
                        color: transaction.type === 'income' ? '#2e7d32' : '#c62828'
                      }}>
                        {transaction.type}
                      </span>
                    </td>
                    <td style={{ padding: '12px' }}>{transaction.category}</td>
                    <td style={{ padding: '12px', color: '#666' }}>
                      {transaction.description || '-'}
                    </td>
                    <td style={{ 
                      padding: '12px', 
                      textAlign: 'right',
                      fontWeight: '500',
                      color: transaction.type === 'income' ? '#2e7d32' : '#c62828'
                    }}>
                      {transaction.type === 'income' ? '+' : '-'}€{transaction.amount.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      </div>
    </div>
  )
}
