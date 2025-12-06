import express from 'express';
import cors from 'cors';
import { handleBatchDownload } from './routes/batch.js';
import { handleBatchProgress } from './routes/progress.js';
import { handleDownloadFile } from './routes/download.js';
import { handleSearch } from './routes/search.js';
import { handleRefreshCookies, handleCookiesStatus } from './routes/cookies.js';
import { startCookieCron } from './jobs/cookieCron.js';

const app = express();
const PORT = process.env.PORT || 3000;

// CORS configuration for Railway production
const allowedOrigins = [
  "https://batchtube.net",
  "https://www.batchtube.net",
  "http://localhost:5173",
  "http://localhost:3000"
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      // In production, allow all origins for Railway flexibility
      callback(null, true);
    }
  },
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: false
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

app.listen(PORT, "0.0.0.0", () => {
  console.log(`[Server] Backend running on port ${PORT}`);
  console.log(`[Server] Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`[Server] Listening on 0.0.0.0:${PORT} (Railway compatible)`);
});
