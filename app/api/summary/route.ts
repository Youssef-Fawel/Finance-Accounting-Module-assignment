import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, extractUserId } from '@/lib/auth'
import { getFinancialSummary } from '@/lib/finance'

export async function GET(req: NextRequest) {
  try {
    const userId = extractUserId(req)
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized: Missing or invalid authorization header' },
        { status: 401 }
      )
    }

    const user = await getAuthenticatedUser(userId)

    const { searchParams } = new URL(req.url)
    const tenantId = searchParams.get('tenantId')

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Bad Request: tenantId query parameter is required' },
        { status: 400 }
      )
    }

    const summary = await getFinancialSummary(user, tenantId)
    return NextResponse.json(
      {
        success: true,
        data: summary
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
    console.error('Summary retrieval error:', error)
    return NextResponse.json(
      { error: 'Internal Server Error', message: error.message },
      { status: 500 }
    )
  }
}
