/**
 * API Configuration
 * Uses environment variable in development, production API in production
 */

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 
  (import.meta.env.DEV ? 'http://localhost:3001' : 'https://api.batchtube.net');

