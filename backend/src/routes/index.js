import { Router } from 'express';
import { handleSearch } from './search.js';
import { handleBatchDownload } from './batch.js';
import { handleBatchProgress } from './progress.js';
import { handleDownloadFile } from './download.js';
import { handleRefreshCookies, handleCookiesStatus } from './cookies.js';
import { handleTestYT } from './test.js';

const router = Router();

// Search routes
router.get('/search', handleSearch);
router.post('/search', handleSearch);

// Batch download routes
router.post('/batch-download', handleBatchDownload);
router.get('/batch-progress/:jobId', handleBatchProgress);
router.get('/download-file/:jobId', handleDownloadFile);

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


