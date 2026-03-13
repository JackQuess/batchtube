import { config } from '../config.js';
import { runProviderSmokeCheck } from '../services/providerSmoke.js';

async function main() {
  const result = await runProviderSmokeCheck({ force: true });
  const required = config.providerSmokeRequiredSuccessRate;
  const actual = result.summary.successRate;
  console.log(
    JSON.stringify({
      msg: 'provider_smoke_summary',
      requiredSuccessRate: required,
      actualSuccessRate: actual,
      ...result.summary
    })
  );
  if (actual < required) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(
    JSON.stringify({
      msg: 'provider_smoke_failed',
      error: error instanceof Error ? error.message : String(error)
    })
  );
  process.exit(1);
});
