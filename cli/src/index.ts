#!/usr/bin/env node

import { Command } from 'commander';
import { runLogin } from './commands/login.js';
import { runLogout } from './commands/logout.js';
import { runWhoami } from './commands/whoami.js';
import { runDownload } from './commands/download.js';
import { runArchive } from './commands/archive.js';
import { runBatch } from './commands/batch.js';
import { runStatus } from './commands/status.js';
import { runFiles } from './commands/files.js';
import { runDownloadFile } from './commands/download-file.js';
import { BatchTubeApiError } from './api.js';

const program = new Command();

program
  .name('batchtube')
  .description('Official BatchTube CLI — batch download from 30+ platforms via the BatchTube API')
  .version('1.0.0')
  .option('--api <url>', 'Override API base URL (e.g. https://api.batchtube.net)')
  .option('--json', 'Machine-readable JSON output (where supported)');

function globalOpts(): { apiBaseUrl?: string; json?: boolean } {
  const o = program.opts();
  return { apiBaseUrl: o.api, json: o.json };
}

program
  .command('login')
  .description('Authenticate with API key and save credentials')
  .action(async () => {
    await runLogin();
  });

program
  .command('logout')
  .description('Remove stored credentials')
  .action(() => {
    runLogout();
  });

program
  .command('whoami')
  .description('Show current account / plan or validate API key')
  .action(async () => {
    await runWhoami(globalOpts().json).catch(handleApiError);
  });

program
  .command('download <url>')
  .description('Create a single-item batch and start processing')
  .option('--format <mp4|mp3>', 'Format', 'mp4')
  .option('--quality <best|1080p|720p>', 'Quality', 'best')
  .option('--zip', 'Archive as ZIP when complete')
  .action(async (url: string, opts: { format?: string; quality?: string; zip?: boolean; json?: boolean }) => {
    const g = globalOpts();
    await runDownload(url, {
      apiBaseUrl: g.apiBaseUrl,
      format: opts.format as 'mp4' | 'mp3',
      quality: opts.quality as 'best' | '1080p' | '720p',
      zip: opts.zip,
      json: g.json ?? opts.json
    }).catch(handleApiError);
  });

program
  .command('batch <file-or-urls...>')
  .description('Create a batch from a file of URLs or multiple URL arguments')
  .option('--format <mp4|mp3>', 'Format', 'mp4')
  .option('--quality <best|1080p|720p>', 'Quality', 'best')
  .option('--zip', 'Archive as ZIP when complete')
  .action(async (fileOrUrls: string[], opts: { format?: string; quality?: string; zip?: boolean; json?: boolean }) => {
    const g = globalOpts();
    await runBatch(fileOrUrls, {
      apiBaseUrl: g.apiBaseUrl,
      format: opts.format as 'mp4' | 'mp3',
      quality: opts.quality as 'best' | '1080p' | '720p',
      zip: opts.zip,
      json: g.json ?? opts.json
    }).catch(handleApiError);
  });

program
  .command('archive <channel-url>')
  .description('Archive a channel/playlist (latest 25 by default). Resolves in background.')
  .option('--latest <n>', 'Latest N items (1-500)', (v) => parseInt(v, 10))
  .option('--all', 'All items (up to plan limit)')
  .option('--select', 'Same as latest 25 for CLI')
  .option('--format <mp4|mp3>', 'Format', 'mp4')
  .option('--quality <best|1080p|720p>', 'Quality', 'best')
  .option('--zip', 'Archive as ZIP when complete')
  .action(async (channelUrl: string, opts: { latest?: number; all?: boolean; select?: boolean; format?: string; quality?: string; zip?: boolean; json?: boolean }) => {
    const g = globalOpts();
    const mode = opts.all ? 'all' : opts.select ? 'latest_25' : opts.latest != null ? 'latest_n' : 'latest_25';
    await runArchive(channelUrl, {
      apiBaseUrl: g.apiBaseUrl,
      mode,
      latest: opts.latest,
      format: opts.format as 'mp4' | 'mp3',
      quality: opts.quality as 'best' | '1080p' | '720p',
      zip: opts.zip,
      json: g.json ?? opts.json
    }).catch(handleApiError);
  });

program
  .command('status <batchId>')
  .description('Fetch batch status')
  .action(async (batchId: string, opts: { json?: boolean }) => {
    const g = globalOpts();
    await runStatus(batchId, { apiBaseUrl: g.apiBaseUrl, json: g.json ?? opts.json }).catch(handleApiError);
  });

program
  .command('files')
  .description('List available files for current account')
  .action(async (opts: { json?: boolean }) => {
    const g = globalOpts();
    await runFiles({ apiBaseUrl: g.apiBaseUrl, json: g.json ?? opts.json }).catch(handleApiError);
  });

program
  .command('download-file <fileId>')
  .description('Get signed download URL for a file')
  .option('--open', 'Open URL in default browser')
  .action(async (fileId: string, opts: { json?: boolean; open?: boolean }) => {
    const g = globalOpts();
    await runDownloadFile(fileId, { apiBaseUrl: g.apiBaseUrl, json: g.json ?? opts.json, open: opts.open }).catch(handleApiError);
  });

function handleApiError(err: unknown): void {
  if (err instanceof BatchTubeApiError) {
    const msg =
      err.code === 'rate_limit_exceeded'
        ? 'Rate limited. Try again later.'
        : err.code === 'service_unavailable'
          ? 'Service temporarily unavailable.'
          : err.code === 'insufficient_credits'
            ? 'Insufficient credits.'
            : err.message;
    console.error(msg);
    process.exit(err.statusCode >= 500 ? 2 : 1);
  }
  throw err;
}

const noSubcommand = !process.argv[2] || process.argv[2].startsWith('-');

program.parseAsync(process.argv).then(() => {
  if (noSubcommand) {
    program.outputHelp();
    process.exit(0);
  }
}).catch((err: Error) => {
  console.error(err.message || err);
  process.exit(1);
});
