import type { FastifyPluginAsync } from 'fastify';
import { getAllProviderHealthSnapshots } from '../services/providerHealth.js';
import { getProviderSmokeSnapshot, runProviderSmokeCheck } from '../services/providerSmoke.js';
import { SUPPORTED_PROVIDER_IDS } from '../services/providers.js';

const providerHealthRoute: FastifyPluginAsync = async (app) => {
  app.get('/v1/providers/health', async (request) => {
    const q = (request.query ?? {}) as { runSmoke?: string };
    if (q.runSmoke === '1' || q.runSmoke === 'true') {
      await runProviderSmokeCheck({ force: true });
    }

    return {
      providers: SUPPORTED_PROVIDER_IDS,
      counters: getAllProviderHealthSnapshots(),
      smoke: getProviderSmokeSnapshot()
    };
  });
};

export default providerHealthRoute;
