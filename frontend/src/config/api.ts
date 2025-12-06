/**
 * API Configuration
 * Determines the base URL for API calls based on environment
 * Production: https://api.batchtube.net (Railway)
 * Development: http://localhost:3000 (local backend)
 */

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 
  (import.meta.env.PROD
    ? 'https://api.batchtube.net'
    : 'http://localhost:3000');

