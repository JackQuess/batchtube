import { CookieProfile, CookieRotationResult } from "./cookie-types.js";

function sortProfiles(profiles: CookieProfile[]): CookieProfile[] {
  return [...profiles].sort((a, b) => {
    if (a.enabled !== b.enabled) return a.enabled ? -1 : 1;
    const aHealthy = a.status === "healthy" || a.status === "degraded";
    const bHealthy = b.status === "healthy" || b.status === "degraded";
    if (aHealthy !== bHealthy) return aHealthy ? -1 : 1;
    if (a.healthScore !== b.healthScore) return b.healthScore - a.healthScore;
    if (a.failureCount !== b.failureCount) return a.failureCount - b.failureCount;
    return (a.lastUsedAt || 0) - (b.lastUsedAt || 0);
  });
}

export class CookieRotator {
  constructor(private readonly profiles: CookieProfile[]) {}

  getActiveCookie(): CookieRotationResult {
    const sorted = sortProfiles(this.profiles);
    const selected = sorted.find((p) => p.enabled && (p.status === "healthy" || p.status === "degraded")) || null;

    if (!selected) {
      return { selected: null, reason: "no_healthy_cookie" };
    }

    selected.lastUsedAt = Date.now();
    return { selected, reason: "selected_by_health" };
  }

  markFailure(cookieId: string): void {
    const profile = this.profiles.find((p) => p.id === cookieId);
    if (!profile) return;
    profile.failureCount += 1;
    profile.healthScore = Math.max(0, profile.healthScore - 15);
    profile.status = profile.healthScore < 40 ? "unhealthy" : "degraded";
  }

  markSuccess(cookieId: string): void {
    const profile = this.profiles.find((p) => p.id === cookieId);
    if (!profile) return;
    profile.successCount += 1;
    profile.healthScore = Math.min(100, profile.healthScore + 5);
    profile.status = profile.healthScore >= 70 ? "healthy" : "degraded";
    profile.lastCheckedAt = Date.now();
  }
}
