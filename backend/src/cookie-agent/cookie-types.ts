export type CookieProfileStatus = "healthy" | "degraded" | "unhealthy" | "disabled";

export interface CookieProfile {
  id: string;
  provider: string;
  filePath: string;
  label: string;
  priority: number;
  enabled: boolean;
  lastUsedAt: number | null;
  lastCheckedAt: number | null;
  healthScore: number;
  failureCount: number;
  successCount: number;
  status: CookieProfileStatus;
}

export interface CookieHealthStatus {
  cookieId: string;
  provider: string;
  status: CookieProfileStatus;
  score: number;
  reason?: string;
  checkedAt: number;
}

export interface CookieRotationResult {
  selected: CookieProfile | null;
  reason: string;
}

export interface CookieValidationResult {
  valid: boolean;
  score: number;
  reason?: string;
}

export interface CookieAgentConfig {
  enabled: boolean;
  cookieDir: string;
  provider: string;
  rotationMode: "health_based";
  minValidScore: number;
  healthCheckIntervalMs: number;
  ytdlpCookieMode: "file";
  testUrl: string;
}
