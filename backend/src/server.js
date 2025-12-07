import express from 'express';
import cors from 'cors';
import routes from './routes/index.js';
import { startCookieCron } from './jobs/cookieCron.js';
import { ensureYTDLP } from './core/bootstrapYTDLP.js';

// Bootstrap yt-dlp before starting server
ensureYTDLP();

const app = express();
const PORT = process.env.PORT || 3001;

// CORS configuration for Railway production
const allowedOrigins = [
  "https://batchtube.net",
  "https://www.batchtube.net",
  "http://localhost:5173",
  "http://localhost:3001"
];

// Single CORS middleware
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

// Handle OPTIONS preflight requests
app.options('*', (req, res) => {
  res.status(204).end();
});

app.use(express.json());

// Mount routes
app.use('/api', routes);

// Start cookie refresh cron job
startCookieCron();

app.listen(PORT, "0.0.0.0", () => {
  console.log(`[Server] Backend running on port ${PORT}`);
  console.log(`[Server] Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`[Server] Listening on 0.0.0.0:${PORT} (Railway compatible)`);
});


