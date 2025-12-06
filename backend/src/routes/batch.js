import { jobStore } from '../core/jobStore.js';
import { batchEngine } from '../core/batchEngine.js';

export const handleBatchDownload = async (req, res) => {
  try {
    const { items } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Items array required' });
    }

    // Validate items
    for (const item of items) {
      if (!item.url) {
        return res.status(400).json({ error: 'Each item must have a url' });
      }
      if (!item.format || !['mp3', 'mp4'].includes(item.format)) {
        return res.status(400).json({ error: 'Format must be mp3 or mp4' });
      }
    }

    console.log(`[Batch] Starting batch download: ${items.length} items`);
    
    const job = jobStore.createJob(items, 'batch');
    
    // Start processing asynchronously
    batchEngine.processJob(job.id).catch(err => {
      console.error(`[Batch] Job ${job.id} failed:`, err);
      jobStore.setJobError(job.id, err.message || 'Batch processing failed');
    });

    res.json({ jobId: job.id });
  } catch (error) {
    console.error('[Batch] Error:', error);
    res.status(500).json({ error: 'Failed to start batch download' });
  }
};
