/**
 * Utility function to get the base URL for API calls
 * Works in both client and server environments
 * Automatically detects if we're in development or production
 */
export function getBaseUrl() {
  // Check if we're in the browser
  if (typeof window !== 'undefined') {
    // In the browser, use the current window location
    return '';  // Empty string means use relative URLs
  }
  
  // In server-side code
  // First check for Vercel environment
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  
  // Then check for custom environment variable
  if (process.env.NEXT_PUBLIC_BASE_URL) {
    return process.env.NEXT_PUBLIC_BASE_URL;
  }
  
  // Default to localhost in development
  return 'http://localhost:3000';
}

/**
 * Utility function to create a full API URL
 * @param {string} path - The API path (e.g., '/api/posts')
 * @param {Object} params - Query parameters as an object
 * @returns {string} The full API URL
 */
export function createApiUrl(path, params = {}) {
  const baseUrl = getBaseUrl();
  
  // Ensure path starts with a slash
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  
  // Convert params object to query string
  const queryParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      queryParams.append(key, value);
    }
  });
  
  const queryString = queryParams.toString();
  const url = `${baseUrl}${normalizedPath}${queryString ? `?${queryString}` : ''}`;
  
  return url;
} 