export type TrackedFormat = 'mp3' | 'mp4';
export type TrackedQuality = '1080p' | '4k';

export interface TrackedJob {
  jobId: string;
  name: string;
  createdAt: string;
  itemsCount: number;
  format: TrackedFormat;
  quality: TrackedQuality;
  urls: string[];
}

const STORAGE_KEY = 'batchtube_tracked_jobs';

const safeParse = <T>(value: string | null, fallback: T): T => {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
};

const readJobs = (): TrackedJob[] => {
  const jobs = safeParse<TrackedJob[]>(localStorage.getItem(STORAGE_KEY), []);
  return jobs
    .filter((job) => Boolean(job?.jobId))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

const writeJobs = (jobs: TrackedJob[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(jobs));
};

export const listTrackedJobs = (): TrackedJob[] => readJobs();

export const saveTrackedJob = (job: TrackedJob) => {
  const jobs = readJobs().filter((item) => item.jobId !== job.jobId);
  writeJobs([job, ...jobs]);
};

export const removeTrackedJob = (jobId: string) => {
  const jobs = readJobs().filter((job) => job.jobId !== jobId);
  writeJobs(jobs);
};

export const clearTrackedJobs = () => {
  localStorage.removeItem(STORAGE_KEY);
};
