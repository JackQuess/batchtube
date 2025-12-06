import cron from "node-cron";
import { cookiesManager } from "../core/CookiesManager.js";

/**
 * Cookie refresh cron job
 * Runs every 12 hours to check and refresh cookies if needed
 */
export function startCookieCron() {
  console.log("[CookieCron] Starting cookie refresh cron job (every 12 hours)");

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

