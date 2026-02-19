export type ViewState = 
  | 'landing' 
  | 'pricing' 
  | 'faq'
  | 'supported-sites'
  | 'legal'
  | 'contact'
  | 'status'
  | 'signup' 
  | 'login' 
  | 'forgot-password'
  | 'onboarding'
  | 'dashboard'
  | 'new-batch'
  | 'queue'
  | 'history'
  | 'files'
  | 'account'
  | 'billing'
  | 'settings'
  | 'not-found';

export interface AuthUser {
  id: string;
  email: string;
  plan: 'free' | 'pro';
}

export interface User {
  email: string;
  name: string;
  plan: 'free' | 'pro' | 'enterprise';
}

export interface BatchJob {
  id: string;
  name: string;
  status: 'processing' | 'completed' | 'failed' | 'queued';
  progress: number;
  files: number;
  totalSize?: string;
  date: string;
  providers: ('youtube' | 'instagram' | 'tiktok' | 'twitter' | 'soundcloud' | 'twitch' | 'mixed')[];
}

export interface QueueItem {
  id: string;
  title: string;
  provider: 'youtube' | 'instagram' | 'tiktok' | 'twitter' | 'soundcloud' | 'twitch';
  status: 'downloading' | 'processing' | 'completed' | 'failed' | 'queued';
  progress: number;
  speed: string;
  size: string;
}

export interface FileItem {
  id: string;
  name: string;
  type: string;
  size: string;
  date: string;
  provider: string;
  batchId: string;
}

export interface PlanFeature {
  text: string;
  included: boolean;
}

export interface PricingPlan {
  name: string;
  price: string;
  period: string;
  description: string;
  features: PlanFeature[];
  highlight?: boolean;
}
