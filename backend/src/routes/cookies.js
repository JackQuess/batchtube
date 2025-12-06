import { cookiesManager } from "../core/CookiesManager.js";

/**
 * Internal endpoint to refresh cookies
 * Protected by secret token (optional, can be added later)
 */
export const handleRefreshCookies = async (req, res) => {
  try {
    // Optional: Add secret token check
    // const secret = req.query.secret || req.headers['x-secret'];
    // if (secret !== process.env.COOKIE_REFRESH_SECRET) {
    //   return res.status(401).json({ error: 'Unauthorized' });
    // }

    console.log("[Cookies] Manual refresh requested");

    const success = await cookiesManager.refresh();

    if (success) {
      res.json({
        success: true,
        message: "Cookies refreshed successfully",
        path: cookiesManager.getCookiesPath(),
        lastUpdate: cookiesManager.getLastUpdateTime()
      });
    } else {
      res.status(500).json({
        success: false,
        error: "Failed to refresh cookies"
      });
    }
  } catch (error) {
    console.error("[Cookies] Refresh error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to refresh cookies"
    });
  }
};

/**
 * Get cookies status
 */
export const handleCookiesStatus = (req, res) => {
  try {
    const exists = cookiesManager.cookiesExist();
    const isStale = cookiesManager.isStale();
    const lastUpdate = cookiesManager.getLastUpdateTime();

    res.json({
      exists,
      isStale,
      lastUpdate,
      age: lastUpdate > 0 ? Date.now() - lastUpdate : null,
      path: cookiesManager.getCookiesPath()
    });
  } catch (error) {
    console.error("[Cookies] Status error:", error);
    res.status(500).json({ error: "Failed to get cookies status" });
  }
};

