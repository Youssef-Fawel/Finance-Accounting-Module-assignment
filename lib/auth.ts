import { supabaseAdmin } from './supabase'

export interface User {
  id: string
  email: string
  tenant_id: string
  role: 'treasurer' | 'viewer'
}

export interface AuthError {
  message: string
  code: 'UNAUTHENTICATED' | 'USER_NOT_FOUND' | 'INVALID_USER'
}

export async function getAuthenticatedUser(userId: string): Promise<User> {
  if (!userId || typeof userId !== 'string') {
    throw {
      message: 'User ID is required and must be a string',
      code: 'INVALID_USER',
    } as AuthError
  }

  const { data: user, error } = await supabaseAdmin
    .from('users')
    .select('id, email, tenant_id, role')
    .eq('id', userId)
    .single()

  if (error || !user) {
    throw {
      message: 'User not found in database',
      code: 'USER_NOT_FOUND',
    } as AuthError
  }

  if (!user.tenant_id) {
    throw {
      message: 'User has no tenant assigned',
      code: 'INVALID_USER',
    } as AuthError
  }

  if (!user.role || !['treasurer', 'viewer'].includes(user.role)) {
    throw {
      message: 'User has invalid role',
      code: 'INVALID_USER',
    } as AuthError
  }

  return user as User
}

export function verifyTenantOwnership(user: User, tenantId: string): void {
  if (user.tenant_id !== tenantId) {
    throw new Error(
      `Access denied: cross-tenant access is forbidden. User belongs to tenant ${user.tenant_id}, attempted access to tenant ${tenantId}`
    )
  }
}

// Extract userId from Authorization header (Bearer token)
export function extractUserId(req: Request): string | null {
  const authHeader = req.headers.get('authorization')
  
  if (!authHeader) {
    return null
  }

  const parts = authHeader.split(' ')
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null
  }

  return parts[1]
}
