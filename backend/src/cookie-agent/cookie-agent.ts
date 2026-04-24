import path from "path";
import {
  CookieAgentConfig,
  CookieHealthStatus,
  CookieProfile
} from "./cookie-types.js";
import { CookieStore } from "./cookie-store.js";
import { CookieRotator } from "./cookie-rotator.js";
import { runCookieHealthCheck } from "./cookie-health.js";

function envBool(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined) return fallback;
  return value.toLowerCase() === "true";
}

function toConfig(): CookieAgentConfig {
  return {
    enabled: envBool(process.env.COOKIE_AGENT_ENABLED, true),
    cookieDir: process.env.COOKIE_DIR || "./runtime/cookies",
    provider: process.env.COOKIE_PROVIDER || "youtube",
    rotationMode: "health_based",
    minValidScore: Number(process.env.COOKIE_MIN_VALID_SCORE || 70),
    healthCheckIntervalMs: Number(process.env.COOKIE_HEALTH_CHECK_INTERVAL_MS || 300000),
    ytdlpCookieMode: "file",
    testUrl: process.env.COOKIE_TEST_URL || "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
  };
}

export class CookieAgent {
  private readonly config: CookieAgentConfig;
  private profiles: CookieProfile[] = [];
  private rotator: CookieRotator | null = null;

  constructor() {
    this.config = toConfig();
  }

  reload(): CookieProfile[] {
    const store = new CookieStore(path.resolve(process.cwd(), this.config.cookieDir), this.config.provider);
    this.profiles = store.loadProfiles();
    this.rotator = new CookieRotator(this.profiles);
    return this.profiles;
  }

  getStatus(): CookieProfile[] {
    return this.profiles;
  }

  isEnabled(): boolean {
    return this.config.enabled;
  }

  getActiveCookiePath(): string | null {
    if (!this.config.enabled || !this.rotator) return null;
    const result = this.rotator.getActiveCookie();
    if (!result.selected) return null;
    if (result.selected.healthScore < this.config.minValidScore) return null;
    console.log(
      `[CookieAgent] Active cookie selected: ${result.selected.label} score=${result.selected.healthScore}`
    );
    return result.selected.filePath;
  }

  markFailure(cookieId: string): void {
    this.rotator?.markFailure(cookieId);
  }

  markSuccess(cookieId: string): void {
    this.rotator?.markSuccess(cookieId);
  }

  async runHealthCheck(): Promise<CookieHealthStatus[]> {
    const health = await Promise.all(
      this.profiles.map((profile) => runCookieHealthCheck(profile, this.config.testUrl))
    );

    this.profiles = this.profiles.map((profile) => {
      const hit = health.find((h) => h.cookieId === profile.id);
      if (!hit) return profile;
      return {
        ...profile,
        status: hit.status,
        healthScore: hit.score,
        lastCheckedAt: hit.checkedAt,
        enabled: hit.status !== "disabled"
      };
    });
    this.rotator = new CookieRotator(this.profiles);
    return health;
  }
}
