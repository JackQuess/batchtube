import { config } from '../../../config.js';

export interface YoutubeEngineStrategy {
  strategyName: 'youtubeFastStrategy' | 'youtubeSafeStrategy' | 'youtubeDefaultStrategy' | 'youtubeFormatOverrideStrategy';
  selectedFormat: string | null;
  mergeOutputEnabled: boolean;
  concurrentFragments: number;
  hardened: boolean;
}

export const youtubeFastStrategy: YoutubeEngineStrategy = {
  strategyName: 'youtubeFastStrategy',
  selectedFormat: 'bv*[ext=mp4][vcodec^=avc1]+ba[ext=m4a]/b[ext=mp4]/best',
  mergeOutputEnabled: true,
  concurrentFragments: Math.max(1, config.ytDlpConcurrentFragmentsFast || 8),
  hardened: false
};

export const youtubeSafeStrategy: YoutubeEngineStrategy = {
  strategyName: 'youtubeSafeStrategy',
  selectedFormat: 'bv*[ext=mp4]+ba[ext=m4a]/b[ext=mp4]/best',
  mergeOutputEnabled: true,
  concurrentFragments: Math.max(1, config.ytDlpConcurrentFragmentsSafe || 4),
  hardened: true
};

export const youtubeDefaultStrategy: YoutubeEngineStrategy = {
  strategyName: 'youtubeDefaultStrategy',
  selectedFormat: null,
  mergeOutputEnabled: false,
  concurrentFragments: Math.max(1, config.ytDlpConcurrentFragmentsSafe || 4),
  hardened: true
};

