-- BatchTube Station seed data
insert into doc_categories (name, slug) values
('Reliability', 'reliability'),
('Operations', 'operations'),
('Performance', 'performance'),
('Platform', 'platform')
on conflict (slug) do nothing;

insert into feedback_categories (name, slug) values
('Reliability', 'reliability'),
('Workflow', 'workflow'),
('Templates', 'templates'),
('Developer', 'developer')
on conflict (slug) do nothing;

insert into template_categories (name, slug) values
('Video', 'video'),
('Audio', 'audio'),
('Bulk', 'bulk')
on conflict (slug) do nothing;

insert into discussion_categories (name, slug) values
('Help', 'help'),
('Reliability', 'reliability'),
('Developer', 'developer'),
('Ops', 'ops')
on conflict (slug) do nothing;

insert into docs (title, slug, excerpt, content, category_id, published, featured)
select x.title, x.slug, x.excerpt, x.content, c.id, true, x.featured
from (values
('YouTube Extraction Reliability Playbook','youtube-extraction-reliability-playbook','Operational strategy for anti-bot changes and extractor drift.','Use layered client fallback, cookies mode escalation, and incident templates.', 'reliability', true),
('Provider Health Model','provider-health-model','How status, incidents, known issues, and changelog are connected.','Status and incident records should be source-of-truth for support and public trust.', 'operations', true),
('Fast MP4 Pipeline Guide','fast-mp4-pipeline-guide','Optimize throughput while preserving compatibility.','Use avc1-first selectors and defer heavy fallback to failure paths only.', 'performance', false),
('Bulk Playlist Download Tuning','bulk-playlist-download-tuning','Practical queue settings for large batches.','Balance provider limits and worker memory under burst load.', 'performance', false),
('Supabase Auth Integration','supabase-auth-integration','Session-safe server/client auth patterns in App Router.','Prefer server components and keep mutating actions auth-guarded.', 'platform', false),
('Template Preset Design Principles','template-preset-design-principles','How to design presets users can trust in production.','Presets should include provider caveats and expected tradeoffs.', 'platform', false),
('Incident Response Runbook','incident-response-runbook','Playbook for degradation and outage communication.','Publish timeline updates at each issue_state transition.', 'operations', true),
('Global Search Normalization','global-search-normalization','Unified search model across docs, roadmap, feedback, and incidents.','Normalize entities and rank by weighted relevance and freshness.', 'platform', false)
) as x(title, slug, excerpt, content, category_slug, featured)
join doc_categories c on c.slug = x.category_slug
on conflict (slug) do nothing;

insert into feedback_posts (title, slug, description, status, category_id)
select x.title, x.slug, x.description, x.status::feedback_status, c.id
from (values
('Per-provider retry controls','per-provider-retry-controls','Expose provider-level retry presets in templates.','planned','reliability'),
('Ultra-fast shorts mode','ultra-fast-shorts-mode','A one-click shorts pipeline with low overhead.','in_progress','workflow'),
('Batch retry from failed only','batch-retry-from-failed-only','Restart failed items without touching successful ones.','completed','workflow'),
('Provider-specific incident badges','provider-specific-incident-badges','Show status hints near provider chips in template pages.','open','reliability'),
('Archive profile presets','archive-profile-presets','Preset sets for channel/profile archive flows.','planned','templates'),
('Webhook test sandbox','webhook-test-sandbox','Built-in webhook payload tester for completion events.','open','developer'),
('Duplicate URL detector improvements','duplicate-url-detector-improvements','Better dedupe for mixed short/long provider URLs.','in_progress','workflow'),
('Advanced m3u8 diagnostics','advanced-m3u8-diagnostics','Expose stream parse diagnostics in failures.','open','reliability'),
('Template sharing links','template-sharing-links','Public read-only links for team templates.','planned','templates'),
('Auto fallback report export','auto-fallback-report-export','CSV export of fallback and retry outcomes.','open','developer')
) x(title,slug,description,status,category_slug)
join feedback_categories c on c.slug = x.category_slug
on conflict (slug) do nothing;

insert into roadmap_items (title, slug, summary, content, status, priority, eta_label, featured)
values
('Adaptive YouTube client strategy v2','adaptive-youtube-client-strategy-v2','Smarter strategy planner using live telemetry.','Adds automatic mode scoring and context-aware retries.','in_progress','critical','Q2 2026',true),
('Provider health SLO dashboard','provider-health-slo-dashboard','Public SLO and MTTR metrics for each provider.','Includes status timeline and success-after-fallback trend.','planned','high','Q2 2026',true),
('Template marketplace v1','template-marketplace-v1','Community presets with verification badge.',null,'under_consideration','medium',null,false),
('Provider-specific anti-bot detectors','provider-specific-anti-bot-detectors','Normalized anti-bot signatures and smart escalations.','Reduces unknown failures and improves triage speed.','planned','high','Q3 2026',false),
('Global command palette search','global-command-palette-search','Cmd+K search over docs, issues, roadmap, templates.',null,'completed','medium','Shipped',false),
('Discussion moderation workflows','discussion-moderation-workflows','Pin/lock/resolve actions and moderation queue.',null,'in_progress','medium','Q2 2026',false),
('Provider smoke-check scheduler','provider-smoke-check-scheduler','Periodic automated checks with alert thresholds.',null,'planned','high','Q2 2026',false),
('Session-safe auth hardening','session-safe-auth-hardening','Role-aware guards for admin/station actions.',null,'completed','high','Shipped',false)
on conflict (slug) do nothing;

insert into templates (title, slug, description, provider, format, quality, example_config, usage_count, featured)
values
('YouTube Shorts MP4','youtube-shorts-mp4','Fast shorts download optimized for startup latency.','youtube','mp4','best','{"mode":"fast"}'::jsonb,9021,true),
('Podcast MP3','podcast-mp3','Reliable speech-first audio extraction.','youtube','mp3','best','{"normalize":true}'::jsonb,6130,true),
('Playlist Bulk Download','playlist-bulk-download','Balanced throughput for long playlists.','youtube','mp4','720p','{"parallel":4}'::jsonb,4502,true),
('Fast MP4 Download','fast-mp4-download','Minimal fallback, max speed for public videos.','generic','mp4','best','{"fallback":false}'::jsonb,5120,false),
('High Quality Merge','high-quality-merge','Quality-first merged output profile.','vimeo','mkv','4k','{"merge":true}'::jsonb,1421,false),
('Audio Extraction Fast Mode','audio-extraction-fast-mode','Fast audio-only fallback profile.','tiktok','mp3','best','{"retries":1}'::jsonb,2320,false)
on conflict (slug) do nothing;

insert into provider_statuses (provider_key, status, summary, success_rate, retry_recovery_rate, last_incident_at)
values
('youtube','operational','Stable with low fallback utilization.',99.20,82.40,now() - interval '8 days'),
('instagram','degraded','Intermittent extraction challenge on reels.',94.60,61.30,now() - interval '3 hours'),
('tiktok','operational','Healthy and fast recovery.',98.40,74.10,now() - interval '5 days'),
('vimeo','operational','No active incidents.',99.50,68.80,now() - interval '19 days'),
('direct','partial_outage','Some hosts require referer headers.',88.20,55.20,now() - interval '1 day')
on conflict (provider_key) do update set
status = excluded.status,
summary = excluded.summary,
success_rate = excluded.success_rate,
retry_recovery_rate = excluded.retry_recovery_rate,
last_incident_at = excluded.last_incident_at,
updated_at = now();

insert into provider_incidents (provider_key, title, slug, status, severity, summary, details, started_at, resolved_at)
values
('instagram','Instagram reels challenge spike','instagram-reels-challenge-spike','monitoring','high','Extractor challenge pages increased in EU region.','Fallback to safer modes active.',now() - interval '8 hours',null),
('direct','Direct provider embed referer validation','direct-embed-referer-validation','identified','medium','Some embeds block requests without referer.','Deploying header fallback strategy.',now() - interval '1 day',null),
('youtube','YouTube extraction drift','youtube-extraction-drift','resolved','high','Page reload challenge pattern changed.','Classifier and fallback strategy patched.',now() - interval '9 days', now() - interval '8 days'),
('tiktok','TikTok temporary rate limiting','tiktok-temporary-rate-limiting','resolved','medium','Spike in 429 responses.','Backoff windows tuned.',now() - interval '6 days', now() - interval '5 days'),
('youtube','Cookie refresh source timeout','cookie-refresh-source-timeout','resolved','low','Cookie source unreachable for 14 minutes.','Secondary endpoint enabled.',now() - interval '15 days', now() - interval '15 days')
on conflict (slug) do nothing;

insert into known_issues (title, slug, provider_key, state, severity, summary, details, workaround)
values
('Certain embed hosts require explicit referer','embed-hosts-require-explicit-referer','direct','identified','medium','Embed domains may reject direct requests.','Use safe header fallback mode.','Retry with provider safe mode.'),
('Instagram reel anti-bot challenge','instagram-reel-anti-bot-challenge','instagram','monitoring','high','Increased anti-bot challenge frequency.','Fallback and retries are active.','Retry after 3-5 minutes.'),
('Rare YouTube nsig mismatch','rare-youtube-nsig-mismatch','youtube','monitoring','medium','Occasional signature extraction mismatch.','Auto recovers in most cases.','Use retry-safe strategy.'),
('Playlist metadata may lag on very large channels','playlist-metadata-lag-large-channels','youtube','investigating','low','Large channel listings can take longer.','Pagination optimization in progress.','Limit latest N.'),
('Vimeo private links require owner token','vimeo-private-links-require-owner-token','vimeo','identified','medium','Private links without access token fail.','Expected provider behavior.','Use public URL or owner token.'),
('M3U8 transient parse timeout','m3u8-transient-parse-timeout','direct','resolved','medium','Timeout on slow manifest hosts.','Socket timeout adjusted.',null)
on conflict (slug) do nothing;

insert into changelog_entries (title, slug, summary, content, category, featured, published, published_at)
values
('YouTube fallback strategy refactor','youtube-fallback-strategy-refactor','Central strategy planner with progressive fallback.','Introduced classification-first retries and improved metrics.','reliability',true,true,now() - interval '1 day'),
('Generic provider referer fallback','generic-provider-referer-fallback','Better support for embed hosts requiring referer.','Added header fallback chain for generic/direct.','reliability',true,true,now()),
('Provider health counters v2','provider-health-counters-v2','Success-after-fallback and permanent failure counters.','Health model now tracks recovery quality.','observability',false,true,now() - interval '2 days'),
('Template gallery polish','template-gallery-polish','Featured templates and provider filters.','Improved discoverability and curation.','product',false,true,now() - interval '4 days'),
('Discussion moderation controls','discussion-moderation-controls','Pin and lock scaffolding for moderators.','Admin-ready discussion management hooks.','community',false,true,now() - interval '6 days'),
('Unified search beta','unified-search-beta','Cross-entity search normalization.','Search across docs, issues, feedback, and roadmap.','platform',false,true,now() - interval '8 days'),
('Auth hardening for station actions','auth-hardening-for-station-actions','Role-safe server actions and route guards.','Server-side action auth checks tightened.','security',false,true,now() - interval '10 days'),
('Incident timeline improvements','incident-timeline-improvements','Clearer status update sequencing.','Added update notes and improved chronology.','status',false,true,now() - interval '12 days')
on conflict (slug) do nothing;

insert into discussions (title, slug, content, category_id, pinned, locked, views_count)
select x.title, x.slug, x.content, dc.id, x.pinned, x.locked, x.views
from (values
('Best presets for Shorts heavy pipelines?','best-presets-for-shorts-heavy-pipelines','Looking for highest throughput with good compatibility.','help',true,false,1222),
('Provider outage communication expectations','provider-outage-communication-expectations','How frequently should status updates be posted?','ops',false,false,882),
('Template import/export format discussion','template-import-export-format-discussion','JSON schema suggestions for template sharing.','developer',false,false,420),
('YouTube retries after page reload challenge','youtube-retries-after-page-reload-challenge','What fallback worked best for your team?','reliability',true,false,1900),
('Request: incident webhook payload examples','request-incident-webhook-payload-examples','Would like sample payloads for status automation.','developer',false,false,310),
('How to tune concurrency for direct provider?','how-to-tune-concurrency-for-direct-provider','Need guidance for unstable hosts.','help',false,false,275),
('Community template quality rubric','community-template-quality-rubric','Proposal for verification badges.','ops',false,false,196),
('Resolved: m3u8 timeout workaround','resolved-m3u8-timeout-workaround','Sharing the workaround that helped us.','help',false,true,560),
('Roadmap priorities for Q3','roadmap-priorities-for-q3','Which items should move up?','ops',false,false,143),
('Provider health dashboard feedback','provider-health-dashboard-feedback','What metrics matter most?','ops',false,false,688)
) as x(title,slug,content,cat_slug,pinned,locked,views)
join discussion_categories dc on dc.slug = x.cat_slug
on conflict (slug) do nothing;

insert into tags (name, slug) values
('youtube','youtube'),('reliability','reliability'),('anti-bot','anti-bot'),('templates','templates'),('search','search'),('status','status'),('incident','incident'),('community','community')
on conflict (slug) do nothing;

-- Optional sample tag links
insert into tag_links (tag_id, entity_type, entity_id)
select t.id, 'docs', d.id
from tags t
join docs d on d.slug = 'youtube-extraction-reliability-playbook'
where t.slug in ('youtube','reliability','anti-bot')
on conflict do nothing;
