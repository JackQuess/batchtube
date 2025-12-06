/**
 * API Configuration
 * Determines the base URL for API calls based on environment
 */

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 
  (import.meta.env.DEV
    ? 'http://localhost:3001'
    : 'https://api.batchtube.net');

