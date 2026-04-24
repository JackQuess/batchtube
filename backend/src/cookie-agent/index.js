const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const DEFAULT_FILES = ['youtube-main.txt', 'youtube-backup-1.txt', 'youtube-backup-2.txt'];

function envBool(value, fallback) {
  if (value === undefined) return fallback;
  return String(value).toLowerCase() === 'true';
}

function maskFile(filePath) {
  return path.basename(filePath || '');
}

function parseConfig() {
  return {
    enabled: envBool(process.env.COOKIE_AGENT_ENABLED, true),
    cookieDir: process.env.COOKIE_DIR || './runtime/cookies',
    provider: process.env.COOKIE_PROVIDER || 'youtube',
    minValidScore: Number(process.env.COOKIE_MIN_VALID_SCORE || 70),
    testUrl: process.env.COOKIE_TEST_URL || 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
  };
}

function validateCookieFile(filePath) {
  if (!fs.existsSync(filePath)) return { valid: false, score: 0, reason: 'file_not_found' };
  const content = fs.readFileSync(filePath, 'utf8');
  if (!content.trim()) return { valid: false, score: 5, reason: 'file_empty' };
  const lines = content.split(/\r?\n/).map((line) => line.trim());
  const validLineCount = lines.filter((line) => line && !line.startsWith('#') && line.split('\t').length >= 7).length;
  if (!validLineCount) return { valid: false, score: 20, reason: 'invalid_netscape_format' };
  return { valid: true, score: Math.min(95, 50 + validLineCount * 5) };
}

class CookieAgentRuntime {
  constructor() {
    this.config = parseConfig();
    this.profiles = [];
  }

  reload() {
    const cookieDir = path.resolve(process.cwd(), this.config.cookieDir);
    fs.mkdirSync(cookieDir, { recursive: true });
    this.profiles = DEFAULT_FILES.map((name, idx) => {
      const filePath = path.join(cookieDir, name);
      const validation = validateCookieFile(filePath);
      return {
        id: `${this.config.provider}-${idx + 1}`,
        provider: this.config.provider,
        filePath,
        label: name,
        priority: idx + 1,
        enabled: validation.valid,
        lastUsedAt: null,
        lastCheckedAt: Date.now(),
        healthScore: validation.score,
        failureCount: 0,
        successCount: 0,
        status: validation.valid ? 'healthy' : 'disabled'
      };
    });
    console.log(`[CookieAgent] Loaded ${this.profiles.length} cookie profiles`);
    return this.getStatus();
  }

  isEnabled() {
    return this.config.enabled;
  }

  getStatus() {
    return this.profiles.map((p) => ({
      ...p,
      filePath: maskFile(p.filePath)
    }));
  }

  getActiveCookie() {
    if (!this.config.enabled) return null;
    const candidates = [...this.profiles]
      .filter((p) => p.enabled && (p.status === 'healthy' || p.status === 'degraded') && p.healthScore >= this.config.minValidScore)
      .sort((a, b) => {
        if (a.healthScore !== b.healthScore) return b.healthScore - a.healthScore;
        if (a.failureCount !== b.failureCount) return a.failureCount - b.failureCount;
        return (a.lastUsedAt || 0) - (b.lastUsedAt || 0);
      });
    const selected = candidates[0] || null;
    if (!selected) return null;
    selected.lastUsedAt = Date.now();
    console.log(`[CookieAgent] Active cookie selected: ${selected.label} score=${selected.healthScore}`);
    return selected;
  }

  markFailure(cookieId, reason) {
    const profile = this.profiles.find((p) => p.id === cookieId);
    if (!profile) return;
    profile.failureCount += 1;
    profile.healthScore = Math.max(0, profile.healthScore - 15);
    profile.status = profile.healthScore < 40 ? 'unhealthy' : 'degraded';
    console.warn(`[CookieAgent] Cookie degraded: ${profile.label} reason=${reason || 'download_failure'}`);
  }

  markSuccess(cookieId) {
    const profile = this.profiles.find((p) => p.id === cookieId);
    if (!profile) return;
    profile.successCount += 1;
    profile.healthScore = Math.min(100, profile.healthScore + 5);
    profile.status = profile.healthScore >= 70 ? 'healthy' : 'degraded';
  }

  async healthCheck() {
    const checks = this.profiles.map((profile) => this.runOneHealth(profile));
    return Promise.all(checks);
  }

  runOneHealth(profile) {
    const validation = validateCookieFile(profile.filePath);
    if (!validation.valid) {
      profile.status = 'disabled';
      profile.healthScore = validation.score;
      return Promise.resolve({ cookieId: profile.id, status: profile.status, score: profile.healthScore, reason: validation.reason });
    }
    return new Promise((resolve) => {
      const child = spawn('yt-dlp', ['--cookies', profile.filePath, '--skip-download', '--dump-json', this.config.testUrl], {
        shell: false,
        stdio: ['ignore', 'pipe', 'pipe']
      });
      let stderr = '';
      let done = false;
      const finish = (status, score, reason) => {
        if (done) return;
        done = true;
        profile.status = status;
        profile.healthScore = score;
        profile.lastCheckedAt = Date.now();
        resolve({ cookieId: profile.id, status, score, reason });
      };
      const timeout = setTimeout(() => {
        child.kill('SIGTERM');
        finish('degraded', 35, 'timeout');
      }, 30000);
      child.stderr.on('data', (d) => { stderr += d.toString(); });
      child.on('close', (code) => {
        clearTimeout(timeout);
        if (code === 0) return finish('healthy', Math.max(profile.healthScore, 80));
        const text = stderr.toLowerCase();
        if (text.includes('403') || text.includes('forbidden')) return finish('unhealthy', 20, '403');
        if (text.includes('sign in') || text.includes('login')) return finish('degraded', 45, 'signin_required');
        if (text.includes('bot') || text.includes('captcha')) return finish('degraded', 40, 'bot_check');
        if (text.includes('age')) return finish('degraded', 50, 'age_restricted');
        return finish('unhealthy', 30, 'health_check_failed');
      });
      child.on('error', () => {
        clearTimeout(timeout);
        finish('degraded', 40, 'spawn_error');
      });
    });
  }
}

const cookieAgent = new CookieAgentRuntime();
cookieAgent.reload();

module.exports = { cookieAgent };
