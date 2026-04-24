import fs from "fs";
import path from "path";
import { CookieProfile } from "./cookie-types.js";
import { validateCookieFile } from "./cookie-validator.js";

const DEFAULT_FILES = ["youtube-main.txt", "youtube-backup-1.txt", "youtube-backup-2.txt"];

export class CookieStore {
  constructor(private readonly cookieDir: string, private readonly provider: string) {}

  loadProfiles(): CookieProfile[] {
    fs.mkdirSync(this.cookieDir, { recursive: true });

    const profiles: CookieProfile[] = DEFAULT_FILES.map((fileName, index) => {
      const filePath = path.join(this.cookieDir, fileName);
      const validation = validateCookieFile(filePath, this.provider);
      return {
        id: `${this.provider}-${index + 1}`,
        provider: this.provider,
        filePath,
        label: fileName,
        priority: index + 1,
        enabled: validation.valid,
        lastUsedAt: null,
        lastCheckedAt: Date.now(),
        healthScore: validation.score,
        failureCount: 0,
        successCount: 0,
        status: validation.valid ? "healthy" : "disabled"
      };
    });

    console.log(`[CookieAgent] Loaded ${profiles.length} cookie profiles`);
    return profiles;
  }
}
