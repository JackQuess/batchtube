import express from 'express';
import cors from 'cors';
import { handleBatchDownload } from './routes/batch.js';
import { handleBatchProgress } from './routes/progress.js';
import { handleDownloadFile } from './routes/download.js';
import { handleSearch } from './routes/search.js';
import { handleRefreshCookies, handleCookiesStatus } from './routes/cookies.js';
import { startCookieCron } from './jobs/cookieCron.js';

const app = express();
const PORT = process.env.PORT || 3001;

// CORS configuration
const allowedOrigins = [
  'https://batchtube.net',
  'https://www.batchtube.net',
  'http://localhost:5173',
  'http://localhost:3000',
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, true);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());

// Routes
app.get('/api/search', handleSearch);
app.post('/api/search', handleSearch);
app.post('/api/batch-download', handleBatchDownload);
app.get('/api/batch-progress/:jobId', handleBatchProgress);
app.get('/api/download-file/:jobId', handleDownloadFile);

// Cookie management routes
app.get('/internal/refresh-cookies', handleRefreshCookies);
app.get('/internal/cookies-status', handleCookiesStatus);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Start cookie refresh cron job
startCookieCron();

app.listen(PORT, () => {
  console.log(`[Server] Backend running on port ${PORT}`);
  console.log(`[Server] Environment: ${process.env.NODE_ENV || 'development'}`);
});
