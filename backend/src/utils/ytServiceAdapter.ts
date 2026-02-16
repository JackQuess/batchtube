export type YtAdapterInfo = {
  id?: string;
  title?: string;
  channel?: string;
  durationSeconds?: number;
  thumbnail?: string;
};

export type YtAdapterDownloadOptions = {
  outDir: string;
  format?: 'video' | 'audio';
  quality?: string;
  baseName?: string;
  onProgress?: (percent: number, textLine?: string) => void;
};

export declare function getInfo(url: string): Promise<YtAdapterInfo>;
export declare function download(
  url: string,
  opts: YtAdapterDownloadOptions
): Promise<{ filePath: string; fileName: string; bytes?: number }>;
