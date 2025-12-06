/**
 * API Configuration
 * Determines the base URL for API calls based on environment
 * Production: https://api.batchtube.net (Railway)
 * Development: http://localhost:3001 (local backend)
 * 
 * Set VITE_API_BASE_URL in .env file to override:
 * - Development: VITE_API_BASE_URL=http://localhost:3001
 * - Production: VITE_API_BASE_URL=https://api.batchtube.net
 */

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 
  (import.meta.env.PROD
    ? 'https://api.batchtube.net'
    : 'http://localhost:3001');

