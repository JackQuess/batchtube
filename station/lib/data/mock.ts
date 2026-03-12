import type {
  ChangelogEntry,
  Discussion,
  DiscussionReply,
  Doc,
  FeedbackComment,
  FeedbackPost,
  Incident,
  KnownIssue,
  ProviderStatus,
  RoadmapItem,
  TemplatePreset
} from '@/types/domain';

const now = new Date();
const iso = (daysAgo: number) => new Date(now.getTime() - daysAgo * 86400000).toISOString();

export const mockDocs: Doc[] = [
  {
    id: 'doc-1',
    title: 'YouTube Extraction Reliability Playbook',
    slug: 'youtube-extraction-reliability-playbook',
    excerpt: 'Operational strategy for anti-bot changes and extractor drift.',
    content: 'Use layered client fallback, cookies mode escalation, and incident templates.',
    category: 'reliability',
    tags: ['youtube', 'anti-bot', 'retries'],
    featured: true,
    updated_at: iso(1)
  },
  {
    id: 'doc-2',
    title: 'Provider Health Model',
    slug: 'provider-health-model',
    excerpt: 'How status, incidents, known issues, and changelog are connected.',
    content: 'Status and incident records should be source-of-truth for support and public trust.',
    category: 'operations',
    tags: ['status', 'incidents'],
    featured: true,
    updated_at: iso(3)
  },
  {
    id: 'doc-3',
    title: 'Fast MP4 Pipeline Guide',
    slug: 'fast-mp4-pipeline-guide',
    excerpt: 'Optimize throughput while preserving compatibility.',
    content: 'Use avc1-first selectors and defer heavy fallback to failure paths only.',
    category: 'performance',
    tags: ['mp4', 'speed'],
    featured: false,
    updated_at: iso(2)
  },
  {
    id: 'doc-4',
    title: 'Bulk Playlist Download Tuning',
    slug: 'bulk-playlist-download-tuning',
    excerpt: 'Practical queue and concurrency settings for large batches.',
    content: 'Balance provider limits and worker memory under burst load.',
    category: 'performance',
    tags: ['playlist', 'queue'],
    featured: false,
    updated_at: iso(5)
  },
  {
    id: 'doc-5',
    title: 'Supabase Auth Integration',
    slug: 'supabase-auth-integration',
    excerpt: 'Session-safe server/client auth patterns in App Router.',
    content: 'Prefer server components and keep mutating actions auth-guarded.',
    category: 'platform',
    tags: ['auth', 'supabase'],
    featured: false,
    updated_at: iso(6)
  },
  {
    id: 'doc-6',
    title: 'Template Preset Design Principles',
    slug: 'template-preset-design-principles',
    excerpt: 'How to design presets users can trust in production.',
    content: 'Presets should include provider caveats and expected tradeoffs.',
    category: 'product',
    tags: ['templates', 'ux'],
    featured: false,
    updated_at: iso(8)
  },
  {
    id: 'doc-7',
    title: 'Incident Response Runbook',
    slug: 'incident-response-runbook',
    excerpt: 'Playbook for degradation and outage communication.',
    content: 'Publish timeline updates at each issue_state transition.',
    category: 'operations',
    tags: ['incident', 'runbook'],
    featured: true,
    updated_at: iso(4)
  },
  {
    id: 'doc-8',
    title: 'Global Search Normalization',
    slug: 'global-search-normalization',
    excerpt: 'Unified search model across docs, roadmap, feedback, and incidents.',
    content: 'Normalize entities and rank by weighted relevance and freshness.',
    category: 'platform',
    tags: ['search'],
    featured: false,
    updated_at: iso(7)
  }
];

export const mockFeedback: FeedbackPost[] = [
  { id: 'fb-1', title: 'Per-provider retry controls', slug: 'per-provider-retry-controls', description: 'Expose provider-level retry presets in templates.', status: 'planned', category: 'reliability', votes_count: 124, comments_count: 16, created_at: iso(5) },
  { id: 'fb-2', title: 'Ultra-fast shorts mode', slug: 'ultra-fast-shorts-mode', description: 'A one-click shorts pipeline with low overhead.', status: 'in_progress', category: 'performance', votes_count: 212, comments_count: 24, created_at: iso(2) },
  { id: 'fb-3', title: 'Batch retry from failed only', slug: 'batch-retry-from-failed-only', description: 'Restart failed items without touching successful ones.', status: 'completed', category: 'workflow', votes_count: 98, comments_count: 11, created_at: iso(12) },
  { id: 'fb-4', title: 'Provider-specific incident badges', slug: 'provider-specific-incident-badges', description: 'Show status hints near provider chips in template pages.', status: 'open', category: 'status', votes_count: 62, comments_count: 7, created_at: iso(1) },
  { id: 'fb-5', title: 'Archive profile presets', slug: 'archive-profile-presets', description: 'Preset sets for channel/profile archive flows.', status: 'planned', category: 'templates', votes_count: 84, comments_count: 8, created_at: iso(10) },
  { id: 'fb-6', title: 'Webhook test sandbox', slug: 'webhook-test-sandbox', description: 'Built-in webhook payload tester for completion events.', status: 'open', category: 'developer', votes_count: 73, comments_count: 6, created_at: iso(3) },
  { id: 'fb-7', title: 'Duplicate URL detector improvements', slug: 'duplicate-url-detector-improvements', description: 'Better dedupe for mixed short/long provider URLs.', status: 'in_progress', category: 'workflow', votes_count: 55, comments_count: 5, created_at: iso(9) },
  { id: 'fb-8', title: 'Advanced m3u8 diagnostics', slug: 'advanced-m3u8-diagnostics', description: 'Expose stream parse diagnostics in failures.', status: 'open', category: 'reliability', votes_count: 66, comments_count: 9, created_at: iso(6) },
  { id: 'fb-9', title: 'Template sharing links', slug: 'template-sharing-links', description: 'Public read-only links for team templates.', status: 'planned', category: 'templates', votes_count: 45, comments_count: 4, created_at: iso(11) },
  { id: 'fb-10', title: 'Auto fallback report export', slug: 'auto-fallback-report-export', description: 'CSV export of fallback and retry outcomes.', status: 'open', category: 'operations', votes_count: 41, comments_count: 2, created_at: iso(4) }
];

export const mockFeedbackComments: FeedbackComment[] = [
  { id: 'fbc-1', feedback_post_id: 'fb-2', content: 'Need this for shorts-heavy teams.', author_name: 'nora', created_at: iso(1) },
  { id: 'fbc-2', feedback_post_id: 'fb-2', content: 'Please include CPU profile knobs.', author_name: 'sam', created_at: iso(1) },
  { id: 'fbc-3', feedback_post_id: 'fb-4', content: 'Great for user trust on outages.', author_name: 'alex', created_at: iso(0) },
  { id: 'fbc-4', feedback_post_id: 'fb-1', content: 'Need per-provider limits and cool-downs.', author_name: 'mira', created_at: iso(2) }
];

export const mockRoadmap: RoadmapItem[] = [
  { id: 'rm-1', title: 'Adaptive YouTube client strategy v2', slug: 'adaptive-youtube-client-strategy-v2', summary: 'Smarter strategy planner using live extractor telemetry.', content: 'Adds automatic mode scoring and context-aware retries.', status: 'in_progress', priority: 'critical', eta_label: 'Q2 2026', tags: ['youtube', 'reliability'], related_feedback_count: 64, updated_at: iso(1) },
  { id: 'rm-2', title: 'Provider health SLO dashboard', slug: 'provider-health-slo-dashboard', summary: 'Public SLO and MTTR metrics for each provider.', content: 'Includes status timeline and success-after-fallback trend.', status: 'planned', priority: 'high', eta_label: 'Q2 2026', tags: ['status', 'trust'], related_feedback_count: 41, updated_at: iso(3) },
  { id: 'rm-3', title: 'Template marketplace v1', slug: 'template-marketplace-v1', summary: 'Community presets with verification badge.', content: null, status: 'under_consideration', priority: 'medium', eta_label: null, tags: ['templates'], related_feedback_count: 33, updated_at: iso(8) },
  { id: 'rm-4', title: 'Provider-specific anti-bot detectors', slug: 'provider-specific-anti-bot-detectors', summary: 'Normalized anti-bot signatures and smart escalations.', content: 'Reduces unknown failures and improves triage speed.', status: 'planned', priority: 'high', eta_label: 'Q3 2026', tags: ['anti-bot', 'ops'], related_feedback_count: 58, updated_at: iso(2) },
  { id: 'rm-5', title: 'Global command palette search', slug: 'global-command-palette-search', summary: 'Cmd+K search over docs, issues, roadmap, templates.', content: null, status: 'completed', priority: 'medium', eta_label: 'Shipped', tags: ['search'], related_feedback_count: 20, updated_at: iso(14) },
  { id: 'rm-6', title: 'Discussion moderation workflows', slug: 'discussion-moderation-workflows', summary: 'Pin/lock/resolve actions and moderation queue.', content: null, status: 'in_progress', priority: 'medium', eta_label: 'Q2 2026', tags: ['community'], related_feedback_count: 15, updated_at: iso(4) },
  { id: 'rm-7', title: 'Provider smoke-check scheduler', slug: 'provider-smoke-check-scheduler', summary: 'Periodic automated checks with alert thresholds.', content: null, status: 'planned', priority: 'high', eta_label: 'Q2 2026', tags: ['status', 'automation'], related_feedback_count: 27, updated_at: iso(2) },
  { id: 'rm-8', title: 'Session-safe auth hardening', slug: 'session-safe-auth-hardening', summary: 'Role-aware guards for admin/station actions.', content: null, status: 'completed', priority: 'high', eta_label: 'Shipped', tags: ['security'], related_feedback_count: 18, updated_at: iso(18) }
];

export const mockTemplates: TemplatePreset[] = [
  { id: 'tp-1', title: 'YouTube Shorts MP4', slug: 'youtube-shorts-mp4', description: 'Fast shorts download optimized for startup latency.', provider: 'youtube', format: 'mp4', quality: 'best', tags: ['shorts', 'fast'], usage_count: 9021, featured: true, example_config: { format: 'mp4', quality: 'best', mode: 'fast' } },
  { id: 'tp-2', title: 'Podcast MP3', slug: 'podcast-mp3', description: 'Reliable speech-first audio extraction.', provider: 'youtube', format: 'mp3', quality: 'best', tags: ['audio', 'podcast'], usage_count: 6130, featured: true, example_config: { format: 'mp3', quality: 'best', normalize: true } },
  { id: 'tp-3', title: 'Playlist Bulk Download', slug: 'playlist-bulk-download', description: 'Balanced throughput for long playlists.', provider: 'youtube', format: 'mp4', quality: '720p', tags: ['playlist', 'batch'], usage_count: 4502, featured: true, example_config: { format: 'mp4', quality: '720p', parallel: 4 } },
  { id: 'tp-4', title: 'Fast MP4 Download', slug: 'fast-mp4-download', description: 'Minimal fallback, max speed for public videos.', provider: 'generic', format: 'mp4', quality: 'best', tags: ['fast'], usage_count: 5120, featured: false, example_config: { format: 'mp4', fallback: false } },
  { id: 'tp-5', title: 'High Quality Merge', slug: 'high-quality-merge', description: 'Quality-first merged output profile.', provider: 'vimeo', format: 'mkv', quality: '4k', tags: ['quality'], usage_count: 1421, featured: false, example_config: { format: 'mkv', quality: '4k', merge: true } },
  { id: 'tp-6', title: 'Audio Extraction Fast Mode', slug: 'audio-extraction-fast-mode', description: 'Fast audio-only fallback profile.', provider: 'tiktok', format: 'mp3', quality: 'best', tags: ['audio', 'fast'], usage_count: 2320, featured: false, example_config: { format: 'mp3', quality: 'best', retries: 1 } }
];

export const mockProviderStatuses: ProviderStatus[] = [
  { provider_key: 'youtube', status: 'operational', summary: 'Stable with low fallback utilization.', success_rate: 99.2, retry_recovery_rate: 82.4, last_incident_at: iso(8), updated_at: iso(0) },
  { provider_key: 'instagram', status: 'degraded', summary: 'Intermittent extraction challenge on reels.', success_rate: 94.6, retry_recovery_rate: 61.3, last_incident_at: iso(0), updated_at: iso(0) },
  { provider_key: 'tiktok', status: 'operational', summary: 'Healthy and fast recovery.', success_rate: 98.4, retry_recovery_rate: 74.1, last_incident_at: iso(5), updated_at: iso(0) },
  { provider_key: 'vimeo', status: 'operational', summary: 'No active incidents.', success_rate: 99.5, retry_recovery_rate: 68.8, last_incident_at: iso(19), updated_at: iso(0) },
  { provider_key: 'direct', status: 'partial_outage', summary: 'Some hosts require referer headers.', success_rate: 88.2, retry_recovery_rate: 55.2, last_incident_at: iso(1), updated_at: iso(0) }
];

export const mockIncidents: Incident[] = [
  { id: 'inc-1', provider_key: 'instagram', title: 'Instagram reels challenge spike', slug: 'instagram-reels-challenge-spike', status: 'monitoring', severity: 'high', summary: 'Extractor challenge pages increased in EU region.', details: 'Fallback to safer modes active.', started_at: iso(0), resolved_at: null, updated_at: iso(0) },
  { id: 'inc-2', provider_key: 'direct', title: 'Direct provider embed referer validation', slug: 'direct-embed-referer-validation', status: 'identified', severity: 'medium', summary: 'Some embeds block requests without referer.', details: 'Deploying header fallback strategy.', started_at: iso(1), resolved_at: null, updated_at: iso(0) },
  { id: 'inc-3', provider_key: 'youtube', title: 'YouTube extraction drift', slug: 'youtube-extraction-drift', status: 'resolved', severity: 'high', summary: 'Page reload challenge pattern changed.', details: 'Classifier and fallback strategy patched.', started_at: iso(9), resolved_at: iso(8), updated_at: iso(8) },
  { id: 'inc-4', provider_key: 'tiktok', title: 'TikTok temporary rate limiting', slug: 'tiktok-temporary-rate-limiting', status: 'resolved', severity: 'medium', summary: 'Spike in 429 responses.', details: 'Backoff windows tuned.', started_at: iso(6), resolved_at: iso(5), updated_at: iso(5) },
  { id: 'inc-5', provider_key: 'youtube', title: 'Cookie refresh source timeout', slug: 'cookie-refresh-source-timeout', status: 'resolved', severity: 'low', summary: 'Cookie source unreachable for 14 minutes.', details: 'Secondary endpoint enabled.', started_at: iso(15), resolved_at: iso(15), updated_at: iso(15) }
];

export const mockIssues: KnownIssue[] = [
  { id: 'iss-1', title: 'Certain embed hosts require explicit referer', slug: 'embed-hosts-require-explicit-referer', provider_key: 'direct', state: 'identified', severity: 'medium', summary: 'Embed domains may reject direct requests.', details: 'Use safe header fallback mode.', workaround: 'Retry with provider safe mode.', updated_at: iso(0) },
  { id: 'iss-2', title: 'Instagram reel anti-bot challenge', slug: 'instagram-reel-anti-bot-challenge', provider_key: 'instagram', state: 'monitoring', severity: 'high', summary: 'Increased anti-bot challenge frequency.', details: 'Fallback and retries are active.', workaround: 'Retry after 3-5 minutes.', updated_at: iso(0) },
  { id: 'iss-3', title: 'Rare YouTube nsig mismatch', slug: 'rare-youtube-nsig-mismatch', provider_key: 'youtube', state: 'monitoring', severity: 'medium', summary: 'Occasional signature extraction mismatch.', details: 'Auto recovers in most cases.', workaround: 'Use retry-safe strategy.', updated_at: iso(1) },
  { id: 'iss-4', title: 'Playlist metadata may lag on very large channels', slug: 'playlist-metadata-lag-large-channels', provider_key: 'youtube', state: 'investigating', severity: 'low', summary: 'Large channel listings can take longer.', details: 'Pagination optimization in progress.', workaround: 'Limit latest N.', updated_at: iso(2) },
  { id: 'iss-5', title: 'Vimeo private links require owner token', slug: 'vimeo-private-links-require-owner-token', provider_key: 'vimeo', state: 'identified', severity: 'medium', summary: 'Private links without access token fail.', details: 'Expected provider behavior.', workaround: 'Use public URL or owner token.', updated_at: iso(6) },
  { id: 'iss-6', title: 'M3U8 transient parse timeout', slug: 'm3u8-transient-parse-timeout', provider_key: 'direct', state: 'resolved', severity: 'medium', summary: 'Timeout on slow manifest hosts.', details: 'Socket timeout adjusted.', workaround: null, updated_at: iso(11) }
];

export const mockChangelog: ChangelogEntry[] = [
  { id: 'cl-1', title: 'YouTube fallback strategy refactor', slug: 'youtube-fallback-strategy-refactor', summary: 'Central strategy planner with progressive fallback.', content: 'Introduced classification-first retries and improved metrics.', category: 'reliability', tags: ['youtube', 'fallback'], published_at: iso(1) },
  { id: 'cl-2', title: 'Generic provider referer fallback', slug: 'generic-provider-referer-fallback', summary: 'Better support for embed hosts requiring referer.', content: 'Added header fallback chain for generic/direct.', category: 'reliability', tags: ['generic', 'direct'], published_at: iso(0) },
  { id: 'cl-3', title: 'Provider health counters v2', slug: 'provider-health-counters-v2', summary: 'Success-after-fallback and permanent failure counters.', content: 'Health model now tracks recovery quality.', category: 'observability', tags: ['metrics'], published_at: iso(2) },
  { id: 'cl-4', title: 'Template gallery polish', slug: 'template-gallery-polish', summary: 'Featured templates and provider filters.', content: 'Improved discoverability and curation.', category: 'product', tags: ['templates'], published_at: iso(4) },
  { id: 'cl-5', title: 'Discussion moderation controls', slug: 'discussion-moderation-controls', summary: 'Pin and lock scaffolding for moderators.', content: 'Admin-ready discussion management hooks.', category: 'community', tags: ['discussion'], published_at: iso(6) },
  { id: 'cl-6', title: 'Unified search beta', slug: 'unified-search-beta', summary: 'Cross-entity search normalization.', content: 'Search across docs, issues, feedback, and roadmap.', category: 'platform', tags: ['search'], published_at: iso(8) },
  { id: 'cl-7', title: 'Auth hardening for station actions', slug: 'auth-hardening-for-station-actions', summary: 'Role-safe server actions and route guards.', content: 'Server-side action auth checks tightened.', category: 'security', tags: ['auth'], published_at: iso(10) },
  { id: 'cl-8', title: 'Incident timeline improvements', slug: 'incident-timeline-improvements', summary: 'Clearer status update sequencing.', content: 'Added update notes and improved chronology.', category: 'status', tags: ['incident'], published_at: iso(12) }
];

export const mockDiscussions: Discussion[] = [
  { id: 'ds-1', title: 'Best presets for Shorts heavy pipelines?', slug: 'best-presets-for-shorts-heavy-pipelines', content: 'Looking for highest throughput with good compatibility.', category: 'help', views_count: 1222, replies_count: 13, pinned: true, locked: false, created_at: iso(2) },
  { id: 'ds-2', title: 'Provider outage communication expectations', slug: 'provider-outage-communication-expectations', content: 'How frequently should status updates be posted?', category: 'ops', views_count: 882, replies_count: 7, pinned: false, locked: false, created_at: iso(5) },
  { id: 'ds-3', title: 'Template import/export format discussion', slug: 'template-import-export-format-discussion', content: 'JSON schema suggestions for template sharing.', category: 'developer', views_count: 420, replies_count: 4, pinned: false, locked: false, created_at: iso(7) },
  { id: 'ds-4', title: 'YouTube retries after page reload challenge', slug: 'youtube-retries-after-page-reload-challenge', content: 'What fallback worked best for your team?', category: 'reliability', views_count: 1900, replies_count: 22, pinned: true, locked: false, created_at: iso(1) },
  { id: 'ds-5', title: 'Request: incident webhook payload examples', slug: 'request-incident-webhook-payload-examples', content: 'Would like sample payloads for status automation.', category: 'developer', views_count: 310, replies_count: 3, pinned: false, locked: false, created_at: iso(4) },
  { id: 'ds-6', title: 'How to tune concurrency for direct provider?', slug: 'how-to-tune-concurrency-for-direct-provider', content: 'Need guidance for unstable hosts.', category: 'help', views_count: 275, replies_count: 2, pinned: false, locked: false, created_at: iso(6) },
  { id: 'ds-7', title: 'Community template quality rubric', slug: 'community-template-quality-rubric', content: 'Proposal for verification badges.', category: 'templates', views_count: 196, replies_count: 1, pinned: false, locked: false, created_at: iso(9) },
  { id: 'ds-8', title: 'Resolved: m3u8 timeout workaround', slug: 'resolved-m3u8-timeout-workaround', content: 'Sharing the workaround that helped us.', category: 'help', views_count: 560, replies_count: 5, pinned: false, locked: true, created_at: iso(11) },
  { id: 'ds-9', title: 'Roadmap priorities for Q3', slug: 'roadmap-priorities-for-q3', content: 'Which items should move up?', category: 'product', views_count: 143, replies_count: 2, pinned: false, locked: false, created_at: iso(10) },
  { id: 'ds-10', title: 'Provider health dashboard feedback', slug: 'provider-health-dashboard-feedback', content: 'What metrics matter most?', category: 'ops', views_count: 688, replies_count: 9, pinned: false, locked: false, created_at: iso(3) }
];

export const mockDiscussionReplies: DiscussionReply[] = [
  { id: 'dr-1', discussion_id: 'ds-4', content: 'Safe mode + cookies file had best recovery for us.', author_name: 'ops-ryan', created_at: iso(0) },
  { id: 'dr-2', discussion_id: 'ds-4', content: 'Also helped to lower first-attempt retries.', author_name: 'lin', created_at: iso(0) },
  { id: 'dr-3', discussion_id: 'ds-1', content: 'Use shorts mp4 preset with fallback enabled.', author_name: 'mia', created_at: iso(1) },
  { id: 'dr-4', discussion_id: 'ds-2', content: '15 minute interval is acceptable during active outage.', author_name: 'omar', created_at: iso(3) }
];
