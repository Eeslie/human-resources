/**
 * Authentication and role-based access control helpers
 */

/**
 * Get user from request headers (from localStorage in client or headers in server)
 */
export function getUserFromRequest(request) {
  // For server-side API routes, we'll get user info from headers
  // The client should send user info in headers
  const userId = request.headers.get('x-user-id');
  const userPosition = request.headers.get('x-user-position');
  const userEmployeeId = request.headers.get('x-user-employee-id');
  
  if (!userId) return null;
  
  return {
    id: userId,
    position: userPosition || '',
    employee_id: userEmployeeId || null
  };
}

/**
 * Check if user has HR/admin position (HR CEO or HR Manager)
 * Uses position field from users table
 */
export function isHR(user) {
  return user && (user.position === 'HR CEO' || user.position === 'HR Manager');
}

/**
 * Check if user is an employee (not HR)
 */
export function isEmployee(user) {
  return user && user.position !== 'HR CEO' && user.position !== 'HR Manager';
}

/**
 * Filter query based on user role
 * - HR users: no filtering (see all data)
 * - Employees: filter by their employee_id
 */
export function applyRoleBasedFilter(query, user, employeeIdColumn = 'employee_id') {
  if (!user) {
    // No user = no access
    return query.eq(employeeIdColumn, '00000000-0000-0000-0000-000000000000'); // Return nothing
  }
  
  if (isHR(user)) {
    // HR sees everything - no filter
    return query;
  }
  
  if (isEmployee(user) && user.employee_id) {
    // Employee sees only their own data
    return query.eq(employeeIdColumn, user.employee_id);
  }
  
  // Default: no access
  return query.eq(employeeIdColumn, '00000000-0000-0000-0000-000000000000');
}

/**
 * Validate that employee_id belongs to the user
 */
export function validateEmployeeAccess(user, employeeId) {
  if (isHR(user)) {
    return true; // HR can access any employee
  }
  
  if (isEmployee(user)) {
    return user.employee_id === employeeId;
  }
  
  return false;
}

