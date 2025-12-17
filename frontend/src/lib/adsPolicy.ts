export interface ShouldShowAdsInput {
  route: string;
  resultsCount: number;
  isLoading: boolean;
  hasError: boolean;
  isModalOpen: boolean;
  consentGranted: boolean;
}

const MIN_RESULTS_FOR_ADS = 8;

function normalizePath(path: string): string {
  const clean = (path || '/').split('?')[0].split('#')[0];
  if (clean.length > 1 && clean.endsWith('/')) return clean.slice(0, -1);
  return clean || '/';
}

export function shouldShowAds(input: ShouldShowAdsInput): boolean {
  const route = normalizePath(input.route);

  if (!input.consentGranted) return false;
  if (input.isLoading) return false;
  if (input.hasError) return false;
  if (input.isModalOpen) return false;

  const neverShowOnRoutes = new Set([
    '/legal',
    '/terms',
    '/privacy',
    '/cookies',
    '/how-it-works',
    '/faq',
    '/supported-sites'
  ]);
  if (neverShowOnRoutes.has(route)) return false;

  // Only allow ads on the real "publisher content" surface: results grid.
  if (route !== '/') return false;
  if (input.resultsCount < MIN_RESULTS_FOR_ADS) return false;

  return true;
}

