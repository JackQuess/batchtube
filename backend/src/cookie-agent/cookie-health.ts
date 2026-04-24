import { spawn } from "child_process";
import path from "path";
import { CookieHealthStatus, CookieProfile } from "./cookie-types.js";
import { validateCookieFile } from "./cookie-validator.js";

function classifyHealthError(raw: string): { status: "degraded" | "unhealthy"; reason: string; score: number } {
  const text = raw.toLowerCase();

  if (text.includes("403") || text.includes("forbidden")) {
    return { status: "unhealthy", reason: "403", score: 20 };
  }
  if (text.includes("sign in") || text.includes("login")) {
    return { status: "degraded", reason: "signin_required", score: 45 };
  }
  if (text.includes("bot") || text.includes("captcha")) {
    return { status: "degraded", reason: "bot_check", score: 40 };
  }
  if (text.includes("age")) {
    return { status: "degraded", reason: "age_restricted", score: 50 };
  }
  return { status: "unhealthy", reason: "health_check_failed", score: 30 };
}

export async function runCookieHealthCheck(
  profile: CookieProfile,
  testUrl: string
): Promise<CookieHealthStatus> {
  const validation = validateCookieFile(profile.filePath, profile.provider);
  const fileName = path.basename(profile.filePath);
  if (!validation.valid) {
    return {
      cookieId: profile.id,
      provider: profile.provider,
      status: "disabled",
      score: validation.score,
      reason: validation.reason || "invalid_cookie_file",
      checkedAt: Date.now()
    };
  }

  return new Promise((resolve) => {
    const args = ["--cookies", profile.filePath, "--skip-download", "--dump-json", testUrl];
    const child = spawn("yt-dlp", args, { shell: false, stdio: ["ignore", "pipe", "pipe"] });
    let stderr = "";
    let settled = false;

    const finish = (status: CookieHealthStatus) => {
      if (settled) return;
      settled = true;
      resolve(status);
    };

    const timeout = setTimeout(() => {
      child.kill("SIGTERM");
      finish({
        cookieId: profile.id,
        provider: profile.provider,
        status: "degraded",
        score: 35,
        reason: "timeout",
        checkedAt: Date.now()
      });
    }, 30000);

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("close", (code) => {
      clearTimeout(timeout);
      if (code === 0) {
        console.log(`[CookieAgent] Health ok: ${fileName}`);
        finish({
          cookieId: profile.id,
          provider: profile.provider,
          status: "healthy",
          score: Math.max(80, validation.score),
          checkedAt: Date.now()
        });
        return;
      }

      const classified = classifyHealthError(stderr);
      console.warn(`[CookieAgent] Cookie ${classified.status}: ${fileName} reason=${classified.reason}`);
      finish({
        cookieId: profile.id,
        provider: profile.provider,
        status: classified.status,
        score: classified.score,
        reason: classified.reason,
        checkedAt: Date.now()
      });
    });

    child.on("error", () => {
      clearTimeout(timeout);
      finish({
        cookieId: profile.id,
        provider: profile.provider,
        status: "degraded",
        score: 40,
        reason: "spawn_error",
        checkedAt: Date.now()
      });
    });
  });
}
