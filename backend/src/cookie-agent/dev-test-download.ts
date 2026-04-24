import { cookieAgent } from "./index.js";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - legacy JS module has no type declarations.
import { downloadWithYtDlp } from "../utils/ytService.js";
import fs from "fs";
import path from "path";

type DownloadWithYtDlpInput = {
  url: string;
  format: "mp3" | "mp4";
  quality: "1080p" | "4k";
  outputPath: string;
};

async function main() {
  cookieAgent.reload();
  const targetUrl = process.env.COOKIE_TEST_URL || "https://www.youtube.com/watch?v=dQw4w9WgXcQ";
  const outDir = path.resolve(process.cwd(), "tmp", "cookie-agent-test");
  fs.mkdirSync(outDir, { recursive: true });
  const outputPath = path.join(outDir, "cookie-agent-test.mp4");

  await (downloadWithYtDlp as (input: DownloadWithYtDlpInput) => Promise<void>)({
    url: targetUrl,
    format: "mp4",
    quality: "1080p",
    outputPath
  });

  console.log(JSON.stringify({ ok: true, outputPath }, null, 2));
}

main().catch((error) => {
  console.error("[CookieAgent] test download failed", error?.message || error);
  process.exit(1);
});
