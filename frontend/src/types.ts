export type VideoFormat = 'mp4' | 'mp3';

export type MP4Quality = '4K' | '1440p' | '1080p' | '720p' | '480p';
export type MP3Quality = '320k' | '128k';
export type VideoQuality = MP4Quality | MP3Quality;

export type JobStatus = 'queued' | 'downloading' | 'processing' | 'completed' | 'failed';

export interface VideoResult {
  id: string;
  url?: string;
  platform?: string;
  title?: string;
  thumbnail?: string;
  duration?: string | null;
  channel?: string;
  channelAvatar?: string;
  views?: string;
  description?: string;
  publishedTime?: string;
}

export interface DownloadItem {
  videoId: string;
  format: VideoFormat;
  status: JobStatus;
  progress: number;
  title?: string;
}

export interface DownloadTask {
  id: string;
  video: VideoResult;
  format: VideoFormat;
  status: JobStatus;
  progress: number;
}

export interface JobProgressResponse {
  id: string;
  status: JobStatus;
  progress: number;
  resultReady: boolean;
  items: DownloadItem[];
  error?: string;
}

export interface SelectionItem {
  video: VideoResult;
  format: VideoFormat;
  quality: VideoQuality;
}

export type UserPlan = 'free' | 'pro';

export interface AuthUser {
  id: string;
  email: string;
  plan: UserPlan;
}

export interface BatchItem {
  index: number;
  title: string;
  percent: number;
  status: JobStatus;
  speed: string;
  eta: string;
  fileName: string | null;
  error: string | null;
}

export interface BatchProgressResponse {
  jobId: string;
  status: JobStatus;
  totalItems: number;
  completedItems: number;
  overallPercent: number;
  items: BatchItem[];
  downloadUrl: string | null;
  error: string | null;
}

export type SupportedLanguage = 'en' | 'es' | 'fr' | 'de' | 'tr' | 'pt' | 'ar';

export type LegalDocType = 'terms' | 'privacy' | 'cookies' | 'legal';
export type InfoDocType = 'howItWorks' | 'faq' | 'supportedSites';

export interface Translations {
  heroTitle: string;
  heroSubtitle: string;
  searchPlaceholder: string;
  searchButton: string;
  pasteLink: string;

  // Card
  singleDownload: string;
  addToBatch: string;
  selected: string;

  // Batch Bar
  itemsSelected: string;
  itemSelected: string;
  clearAll: string;
  downloadZip: string;
  formatLabel: string;
  formatShort: string;
  qualityLabel: string;
  qualityShort: string;
  viewList: string;
  readyToProcess: string;

  // Status
  downloading: string;
  processing: string;
  completed: string;
  failed: string;
  saveFile: string;
  preparing: string;
  waiting: string;
  success: string;
  error: string;

  // Legal / Info
  terms: string;
  privacy: string;
  cookies: string;
  legal: string;
  howItWorks: string;
  faq: string;
  supportedSites: string;
  pricing: string;
  seePricing: string;
  upgrade: string;
  login: string;
  signup: string;
  account: string;
  logout: string;
  supportedPlatformsTitle: string;
  supportedPlatformsSubtitle: string;
  availabilityNote: string;
  plansTitle: string;
  pricingSubtitle: string;
  monthlyPrice: string;
  freePlan: string;
  proPlan: string;
  upgradeNow: string;
  currentPlan: string;
  upToVideosPerBatch: string;
  maxQuality: string;
  adsEnabled: string;
  limitedDailyUsage: string;
  standardQueue: string;
  noAds: string;
  priorityQueue: string;
  fasterZip: string;
  retrySupport: string;
  accountTitle: string;
  accountSubtitle: string;
  userIdLabel: string;
  emailLabel: string;
  currentPlanLabel: string;
  planFreeLabel: string;
  planProLabel: string;
  manageSubscription: string;
  manageSubscriptionSoon: string;
  loginTitle: string;
  loginSubtitle: string;
  signupTitle: string;
  signupSubtitle: string;
  continueButton: string;
  createAccountButton: string;
  noAccountYet: string;
  alreadyHaveAccount: string;
  upgradeForQualityTooltip: string;
  freeBatchLimitMessage: string;
  checkoutUnavailable: string;
  loginToUpgrade: string;
  close: string;
  acceptCookies: string;
  cookieMessage: string;
  allRightsReserved: string;

  // Messages
  searchFailed: string;
  noResultsFound: string;
  noResultsAvailable: string;
  backToSearch: string;
  batchStartFailed: string;
  notFoundTitle: string;
  notFoundBody: string;

  // Metadata
  metadataUnavailable: string;
  unknownChannel: string;
  noItemsSelected: string;
  itemsLabel: string;
  itemLabel: string;

  // Progress/Batch
  batchCompleted: string;
  batchFailed: string;
  waitingInQueue: string;
  preparingDownload: string;
  succeededLabel: string;

  // Cookie Consent
  cookie: {
    message: string;
    accept: string;
    reject: string;
    essential: string;
    reset: string;
  };
}
