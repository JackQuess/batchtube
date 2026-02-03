
import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs-extra';
import { searchYouTube } from './src/services/parser.js';
import { startBatchJob } from './src/core/batchEngine.js';
import { progressStore } from './src/core/progressStore.js';
import { DownloadRequestItem } from './src/types.js';

const app = express();
const PORT = process.env.PORT || 3001;
const DOWNLOADS_ROOT = path.resolve('downloads');

// CORS configuration - allow specified frontend URLs
const ALLOWED_ORIGINS = [
  'https://www.batchtube.net',
  'http://localhost:3000',
  'http://localhost:5173',
  ...(process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(',').map(url => url.trim()) : [])
];

const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Check if origin is in allowed list
    if (ALLOWED_ORIGINS.some(url => origin.startsWith(url))) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json());

// --- API ROUTES ---

// 1. Search (GET /api/search?q=...)
app.get('/api/search', async (req, res) => {
  try {
    const query = req.query.q as string;
    if (!query) return res.status(400).json({ error: 'Query required' });
    const results = await searchYouTube(query);
    res.json(results);
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});

// 2. Single Download (POST /api/single)
app.post('/api/single', (req, res) => {
  const { url, format, quality, title, videoId } = req.body;
  
  if (!url && !videoId) return res.status(400).json({ error: 'URL or VideoID required' });
  
  const targetUrl = url || `https://www.youtube.com/watch?v=${videoId}`;

  const item: DownloadRequestItem = {
    url: targetUrl,
    format: format || 'mp3',
    quality: quality || 'best',
    title: title
  };

  const jobId = startBatchJob([item]);
  res.json({ jobId });
});

// 3. Batch Download (POST /api/batch)
app.post('/api/batch', (req, res) => {
  const { items } = req.body;
  
  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Items array required' });
  }

  const normalizedItems: DownloadRequestItem[] = items.map((i: any) => ({
    url: i.url || `https://www.youtube.com/watch?v=${i.videoId}`,
    format: i.format || 'mp3',
    quality: i.quality || 'best',
    title: i.title
  }));

  const jobId = startBatchJob(normalizedItems);
  res.json({ jobId });
});

// 4. Progress (GET /api/progress/:jobId)
app.get('/api/progress/:jobId', (req, res) => {
  const { jobId } = req.params;
  const job = progressStore.get(jobId);
  
  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }

  res.json({
    id: job.jobId,
    status: job.status,
    progress: job.progress,
    resultReady: job.status === 'completed',
    items: job.items.map(i => ({
      videoId: i.url,
      status: i.status,
      progress: i.progress
    })),
    downloadUrl: job.downloadUrl
  });
});

// 5. Download File (GET /api/download/:fileName)
app.get('/api/download/:fileName', (req, res) => {
  const { fileName } = req.params;
  const filePath = path.join(DOWNLOADS_ROOT, fileName);

  if (!filePath.startsWith(DOWNLOADS_ROOT)) {
    return res.status(403).send('Access denied');
  }

  if (fs.existsSync(filePath)) {
    res.download(filePath);
  } else {
    res.status(404).send('File not found');
  }
});

// Legacy aliases for compatibility
app.post('/api/single-download', (req, res) => {
  const { videoId, format, title } = req.body;
  const url = `https://www.youtube.com/watch?v=${videoId}`;
  const jobId = startBatchJob([{ url, format, title }]);
  res.json({ jobId });
});

app.get('/api/job-progress/:jobId', (req, res) => {
  res.redirect(`/api/progress/${req.params.jobId}`);
});

app.get('/api/download-file/:jobId', (req, res) => {
  const job = progressStore.get(req.params.jobId);
  if (job && job.downloadUrl) {
    res.redirect(job.downloadUrl);
  } else {
    res.status(404).send('File not ready');
  }
});

// Periodic Cleanup
setInterval(() => progressStore.cleanup(), 60 * 60 * 1000);

app.listen(PORT, () => {
  console.log(`Backend API server running on port ${PORT}`);
  console.log(`Downloads root: ${DOWNLOADS_ROOT}`);
  console.log(`CORS enabled for: ${ALLOWED_ORIGINS.join(', ')}`);
});

