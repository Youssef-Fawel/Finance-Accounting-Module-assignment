import { User } from './auth'

export type Permission = 'read' | 'write'

export interface RBACError {
  message: string
  code: 'FORBIDDEN'
  requiredPermission: Permission
  userRole: string
}

const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  treasurer: ['read', 'write'],
  viewer: ['read'],
}

export function requirePermission(user: User, permission: Permission): void {
  const userPermissions = ROLE_PERMISSIONS[user.role]

  if (!userPermissions) {
    throw new Error(`Invalid role: ${user.role}`)
  }

  if (!userPermissions.includes(permission)) {
    throw new Error(
      `Access denied: Role '${user.role}' does not have '${permission}' permission`
    )
  }
}

export function canCreateTransaction(user: User): boolean {
  return user.role === 'treasurer'
}

export function canReadTransactions(user: User): boolean {
  return ['treasurer', 'viewer'].includes(user.role)
}

export function requireWritePermission(user: User): void {
  requirePermission(user, 'write')
}

export function requireReadPermission(user: User): void {
  requirePermission(user, 'read')
}
