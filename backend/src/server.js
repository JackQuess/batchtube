/**
 * BatchTube 2.0 - Express Server
 * Main API server (does NOT run worker)
 */
const express = require('express');
const cors = require('cors');
const batchRoutes = require('./routes/batch');
const { handleSearch } = require('./routes/search');
const internalRoutes = require('./routes/internalRoutes');

// Initialize queue (will fail gracefully if Redis is not available)
// Queue is initialized in queue.js, just require it here
const batchQueue = require('./queue');
if (batchQueue) {
  console.log('[Server] Queue system available');
} else {
  console.warn('[Server] Queue system not available (Redis may not be running)');
  console.warn('[Server] Batch download features will not work until Redis is available');
}

const app = express();
const PORT = process.env.PORT || 3001;

// CORS configuration
const allowedOrigins = process.env.ALLOWED_ORIGIN 
  ? process.env.ALLOWED_ORIGIN.split(',')
  : [
      'https://batchtube.net',
      'https://www.batchtube.net',
      'http://localhost:5173',
      'http://localhost:3000'
    ];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
      callback(null, true);
    } else {
      callback(null, true); // Allow all in production for flexibility
    }
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: false
}));

// Handle OPTIONS preflight requests
app.options('*', (req, res) => {
  res.status(204).end();
});

app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'batchtube-api' });
});

// Search routes
app.get('/api/search', handleSearch);
app.post('/api/search', handleSearch);

// Internal routes (worker-to-API communication)
app.use('/internal', internalRoutes);

// Batch routes
app.use('/api', batchRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('[Server] Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[Server] BatchTube API running on port ${PORT}`);
  console.log(`[Server] Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`[Server] Listening on 0.0.0.0:${PORT} (Railway compatible)`);
});
