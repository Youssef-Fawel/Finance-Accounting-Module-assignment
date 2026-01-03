import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, extractUserId } from '@/lib/auth'
import { createTransaction, getTransactions } from '@/lib/finance'

export async function POST(req: NextRequest) {
  try {
    const userId = extractUserId(req)
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized: Missing or invalid authorization header' },
        { status: 401 }
      )
    }

    const user = await getAuthenticatedUser(userId)

    const body = await req.json()
    const { tenantId, ...transactionData } = body

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Bad Request: tenantId is required' },
        { status: 400 }
      )
    }

    const transaction = await createTransaction(user, tenantId, transactionData)
    return NextResponse.json(
      { 
        success: true,
        data: transaction,
        message: 'Transaction created successfully'
      },
      { status: 201 }
    )

  } catch (error: any) {
    // Handle validation errors
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { 
          error: 'Validation Error',
          details: error.errors 
        },
        { status: 400 }
      )
    }

    // Handle RBAC errors
    if (error.code === 'FORBIDDEN') {
      return NextResponse.json(
        { 
          error: error.message,
          code: error.code,
          details: {
            requiredPermission: error.requiredPermission,
            userRole: error.userRole
          }
        },
        { status: 403 }
      )
    }

    // Handle authentication errors
    if (error.code === 'USER_NOT_FOUND' || error.code === 'INVALID_USER') {
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      )
    }

    // Handle tenant ownership errors
    if (error.message?.includes('Access denied')) {
      return NextResponse.json(
        { error: error.message },
        { status: 403 }
      )
    }

    // Generic error
    console.error('Transaction creation error:', error)
    return NextResponse.json(
      { error: 'Internal Server Error', message: error.message },
      { status: 500 }
    )
  }
}

export async function GET(req: NextRequest) {
  try {
    // Step 1: Extract user ID from authorization header
    const userId = extractUserId(req)
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized: Missing or invalid authorization header' },
        { status: 401 }
      )
    }

    // Step 2: Get authenticated user from database
    const user = await getAuthenticatedUser(userId)

    // Step 3: Extract tenantId from query parameters
    const { searchParams } = new URL(req.url)
    const tenantId = searchParams.get('tenantId')

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Bad Request: tenantId query parameter is required' },
        { status: 400 }
      )
    }

    const transactions = await getTransactions(user, tenantId)
    return NextResponse.json(
      {
        success: true,
        data: transactions,
        count: transactions.length
      },
      { status: 200 }
    )

  } catch (error: any) {
    // Handle RBAC errors
    if (error.code === 'FORBIDDEN') {
      return NextResponse.json(
        { 
          error: error.message,
          code: error.code
        },
        { status: 403 }
      )
    }

    // Handle authentication errors
    if (error.code === 'USER_NOT_FOUND' || error.code === 'INVALID_USER') {
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      )
    }

    // Handle tenant ownership errors
    if (error.message?.includes('Access denied')) {
      return NextResponse.json(
        { error: error.message },
        { status: 403 }
      )
    }

    // Generic error
    console.error('Transaction retrieval error:', error)
    return NextResponse.json(
      { error: 'Internal Server Error', message: error.message },
      { status: 500 }
    )
  }
}
