import cron from "node-cron";
import { cookiesManager } from "../core/CookiesManager.js";

/**
 * Cookie refresh cron job
 * Runs periodically to check if cookies are stale (by real expiry in cookies.txt)
 * and refreshes only when expired or expiring within REFRESH_BEFORE_DAYS — not on a fixed schedule.
 */
export function startCookieCron() {
  console.log("[CookieCron] Starting cookie refresh check (every 12h, refresh only when expired or soon to expire)");

  // Run every 12 hours: 0 */12 * * *
  cron.schedule("0 */12 * * *", async () => {
    console.log("[CookieCron] Scheduled cookie check triggered");
    try {
      await cookiesManager.ensureFresh();
    } catch (err) {
      console.error("[CookieCron] Error in scheduled refresh:", err);
    }
  });

  // Also check on startup
  cookiesManager.ensureFresh().catch(err => {
    console.error("[CookieCron] Error in startup cookie check:", err);
  });
}

