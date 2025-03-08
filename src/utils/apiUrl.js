import { getBaseUrl, createApiUrl } from './apiUtils';

/**
 * Generates a proper API URL by ensuring it has the base URL when needed
 * @param {string} path - The API path (e.g., '/api/posts')
 * @param {Object} params - Query parameters as an object (optional)
 * @returns {string} - The complete URL
 */
export const getApiUrl = (path, params = {}) => {
  // Use the existing createApiUrl function
  return createApiUrl(path, params);
}; 