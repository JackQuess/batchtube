import { execSync } from "child_process";

export function ensureYTDLP() {
  try {
    console.log("[Bootstrap] Checking yt-dlp version...");
    const version = execSync("yt-dlp --version").toString().trim();
    console.log("[Bootstrap] yt-dlp found:", version);
  } catch (err) {
    console.log("[Bootstrap] yt-dlp missing. Installing latest version...");
    execSync("pip install --upgrade yt-dlp", { stdio: "inherit" });
    console.log("[Bootstrap] Successfully installed yt-dlp.");
  }
}

