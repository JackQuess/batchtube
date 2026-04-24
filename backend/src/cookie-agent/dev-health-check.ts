import { cookieAgent } from "./index.js";

async function main() {
  cookieAgent.reload();
  const result = await cookieAgent.runHealthCheck();
  console.log(JSON.stringify({ result }, null, 2));
}

main().catch((error) => {
  console.error("[CookieAgent] health check failed", error?.message || error);
  process.exit(1);
});
