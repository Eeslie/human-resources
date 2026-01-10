/**
 * Client-side API helper that automatically includes user authentication info
 */

/**
 * Get authenticated fetch options with user info in headers
 */
export function getAuthHeaders() {
  if (typeof window === 'undefined') return {};
  
  const userStr = localStorage.getItem('user');
  if (!userStr) return {};
  
  try {
    const user = JSON.parse(userStr);
    return {
      'x-user-id': user.id || '',
      'x-user-position': user.position || '',
      'x-user-employee-id': user.employeeId || ''
    };
  } catch (e) {
    return {};
  }
}

/**
 * Authenticated fetch wrapper
 */
export async function authFetch(url, options = {}) {
  const headers = {
    ...getAuthHeaders(),
    ...options.headers,
    'Content-Type': 'application/json'
  };
  
  return fetch(url, {
    ...options,
    headers
  });
}

