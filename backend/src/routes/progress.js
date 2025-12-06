import { jobStore } from '../core/jobStore.js';

export const handleBatchProgress = (req, res) => {
  try {
    const { jobId } = req.params;
    const job = jobStore.getJob(jobId);

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Map backend status to frontend status
    let status = job.status;
    if (status === 'queued') status = 'downloading';
    if (status === 'processing') status = 'processing';
    // 'downloading', 'completed', 'failed' stay as-is

    // Calculate overall percent
    const overallPercent = job.totalItems > 0 
      ? Math.round((job.completedItems / job.totalItems) * 100)
      : 0;

    // Map items to frontend format
    const items = (job.items || []).map(item => ({
      index: item.index,
      title: item.title || 'Unknown',
      percent: item.percent || 0,
      status: item.status || 'queued',
      speed: item.speed || '0 B/s',
      eta: item.eta || '--',
      fileName: item.fileName || null,
      error: item.error || null
    }));

    res.json({
      jobId: job.id,
      status: status,
      totalItems: job.totalItems,
      completedItems: job.completedItems,
      overallPercent: overallPercent,
      items: items,
      downloadUrl: job.downloadUrl || null,
      error: job.error || null
    });
  } catch (error) {
    console.error('[Progress] Error:', error);
    res.status(500).json({ error: 'Failed to get progress' });
  }
};
