export type AppRole = 'user' | 'moderator' | 'admin';

export type FeedbackStatus = 'open' | 'planned' | 'in_progress' | 'completed' | 'declined';
export type RoadmapStatus = 'under_consideration' | 'planned' | 'in_progress' | 'completed';
export type ProviderHealthStatus = 'operational' | 'degraded' | 'partial_outage' | 'outage';
export type IncidentStatus = 'investigating' | 'identified' | 'monitoring' | 'resolved';
export type IssueState = 'investigating' | 'identified' | 'monitoring' | 'resolved';

export interface Profile {
  id: string;
  username: string | null;
  avatar_url: string | null;
  role: AppRole;
}

export interface Doc {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: string;
  tags: string[];
  featured: boolean;
  updated_at: string;
}

export interface FeedbackPost {
  id: string;
  title: string;
  slug: string;
  description: string;
  status: FeedbackStatus;
  category: string;
  votes_count: number;
  comments_count: number;
  created_at: string;
}

export interface FeedbackComment {
  id: string;
  feedback_post_id: string;
  content: string;
  author_name: string;
  created_at: string;
}

export interface RoadmapItem {
  id: string;
  title: string;
  slug: string;
  summary: string;
  content: string | null;
  status: RoadmapStatus;
  priority: 'low' | 'medium' | 'high' | 'critical';
  eta_label: string | null;
  tags: string[];
  related_feedback_count: number;
  updated_at: string;
}

export interface TemplatePreset {
  id: string;
  title: string;
  slug: string;
  description: string;
  provider: string;
  format: string;
  quality: string;
  tags: string[];
  usage_count: number;
  featured: boolean;
  example_config: Record<string, unknown> | null;
}

export interface ProviderStatus {
  provider_key: string;
  status: ProviderHealthStatus;
  summary: string;
  success_rate: number | null;
  retry_recovery_rate: number | null;
  last_incident_at: string | null;
  updated_at: string;
}

export interface Incident {
  id: string;
  provider_key: string;
  title: string;
  slug: string;
  status: IncidentStatus;
  severity: string;
  summary: string;
  details: string;
  started_at: string;
  resolved_at: string | null;
  updated_at: string;
}

export interface KnownIssue {
  id: string;
  title: string;
  slug: string;
  provider_key: string | null;
  state: IssueState;
  severity: string;
  summary: string;
  details: string;
  workaround: string | null;
  updated_at: string;
}

export interface ChangelogEntry {
  id: string;
  title: string;
  slug: string;
  summary: string;
  content: string;
  category: string;
  tags: string[];
  published_at: string;
}

export interface Discussion {
  id: string;
  title: string;
  slug: string;
  content: string;
  category: string;
  views_count: number;
  replies_count: number;
  pinned: boolean;
  locked: boolean;
  created_at: string;
}

export interface DiscussionReply {
  id: string;
  discussion_id: string;
  content: string;
  author_name: string;
  created_at: string;
}

export type SearchEntity =
  | { type: 'doc'; item: Doc }
  | { type: 'feedback'; item: FeedbackPost }
  | { type: 'roadmap'; item: RoadmapItem }
  | { type: 'template'; item: TemplatePreset }
  | { type: 'issue'; item: KnownIssue }
  | { type: 'changelog'; item: ChangelogEntry }
  | { type: 'discussion'; item: Discussion }
  | { type: 'incident'; item: Incident };
