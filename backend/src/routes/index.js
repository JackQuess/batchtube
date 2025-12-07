import { Router } from 'express';
import { handleSearch } from './search.js';
import singleRouter from './single.js';
import batchRouter from './batch.js';
import { handleRefreshCookies, handleCookiesStatus } from './cookies.js';
import { handleTestYT } from './test.js';

const router = Router();

// Search routes
router.get('/search', handleSearch);
router.post('/search', handleSearch);

// Single download routes (legacy, keep for compatibility)
router.use('/', singleRouter);

// Batch download routes (BatchTube 2.0 - queue-based)
router.use('/', batchRouter);

// Cookie management routes
router.get('/internal/refresh-cookies', handleRefreshCookies);
router.get('/internal/cookies-status', handleCookiesStatus);

// Test route
router.get('/test-yt', handleTestYT);

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

export default router;


