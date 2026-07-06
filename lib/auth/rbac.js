/**
 * lib/auth/rbac.js
 * Role-Based Access Control helpers.
 *
 * Architecture role: Identity & Access Management - authorization layer.
 * Authentication (who you are) is handled by session.js.
 * Authorization (what you can do) is handled here.
 */

import { ROLES, ROLE_PERMISSIONS } from '@/lib/constants'

/**
 * Returns true if the given role has the specified permission.
 *
 * @param {string} role - One of ROLES values
 * @param {string} permission - One of: 'read', 'write', 'delete', 'manage', 'billing'
 * @returns {boolean}
 */
export function hasPermission(role, permission) {
  const permissions = ROLE_PERMISSIONS[role]
  if (!permissions) return false
  return permissions.includes(permission)
}

/**
 * Returns true if the role can perform write operations.
 * Convenience shorthand for the most common check.
 *
 * @param {string} role
 * @returns {boolean}
 */
export function canWrite(role) {
  return hasPermission(role, 'write')
}

/**
 * Returns true if the role can delete resources.
 *
 * @param {string} role
 * @returns {boolean}
 */
export function canDelete(role) {
  return hasPermission(role, 'delete')
}

/**
 * Returns true if the role can manage team/settings.
 *
 * @param {string} role
 * @returns {boolean}
 */
export function canManage(role) {
  return hasPermission(role, 'manage')
}

/**
 * Returns true if the role can access billing.
 *
 * @param {string} role
 * @returns {boolean}
 */
export function canAccessBilling(role) {
  return hasPermission(role, 'billing')
}

/**
 * Asserts a permission and throws a structured error if denied.
 * Use this in API route handlers to gate operations.
 *
 * @param {string|null} role
 * @param {string} permission
 * @param {string} [action] - Human-readable description for error messages
 * @throws {{ status: 403, message: string }}
 */
export function assertPermission(role, permission, action = permission) {
  if (!role || !hasPermission(role, action)) {
    const err = new Error(`Permission denied: '${action}' requires ${getMinimumRole(permission)} role or higher.`)
    err.status = 403
    throw err
  }
}

/**
 * Returns the minimum role required for a permission.
 *
 * @param {string} permission
 * @returns {string}
 */
function getMinimumRole(permission) {
  const roleOrder = [ROLES.OWNER, ROLES.ADMIN, ROLES.MEMBER, ROLES.VIEWER]
  for (const role of roleOrder.reverse()) {
    if (hasPermission(role, permission)) return role
  }
  return ROLES.OWNER
}
