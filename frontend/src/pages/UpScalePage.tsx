import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  UploadCloud,
  FileVideo,
  Settings2,
  Play,
  Download,
  CheckCircle2,
  XCircle,
  Loader2,
  Lock,
  ChevronRight,
  Cpu,
  Sparkles,
  Monitor,
  Clock,
  Video,
  FileArchive
} from 'lucide-react';
import {
  upscaleAPI,
  type TargetFormat,
  type TargetResolution
} from '../services/upscaleAPI';

type UpScaleStatus = 'locked' | 'empty' | 'files_added' | 'processing' | 'completed';

interface ProcessFile {
  id: string;
  name: string;
  res: string;
  format: string;
  size: string;
  duration: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number;
}

export function UpScalePage() {
  const [status, setStatus] = useState<UpScaleStatus>('empty');
  const [overallProgress, setOverallProgress] = useState(0);
  const [files, setFiles] = useState<ProcessFile[]>([]);
  const [rawFiles, setRawFiles] = useState<File[]>([]);
  const [targetResolution, setTargetResolution] = useState<TargetResolution>('4k');
  const [targetFormat, setTargetFormat] = useState<TargetFormat>('mp4');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFilesSelected = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    const nextFiles = Array.from(fileList);
    setRawFiles(nextFiles);
    setFiles(
      nextFiles.map((file, index) => {
        const ext = file.name.split('.').pop() || '';
        const format = ext.toLowerCase() || 'mp4';
        const sizeMb = file.size / (1024 * 1024);
        return {
          id: `local-${index}`,
          name: file.name,
          res: '—',
          format,
          size: `${sizeMb.toFixed(1)} MB`,
          duration: '—',
          status: 'queued',
          progress: 0
        };
      })
    );
    setStatus('files_added');
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const startProcessing = async () => {
    if (files.length === 0 || rawFiles.length === 0 || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const createBody = {
        name: undefined,
        options: {
          processing_mode: 'upscale_4k' as const,
          target_resolution: targetResolution,
          target_format: targetFormat,
          archive_as_zip: true
        },
        files: rawFiles.map((file) => ({
          filename: file.name,
          content_type: file.type || 'application/octet-stream',
          size_bytes: file.size
        }))
      };

      const created = await upscaleAPI.createJob(createBody);

      await Promise.all(
        created.files.map(async (info, index) => {
          const file = rawFiles[index];
          if (!file) return;
          await fetch(info.upload_url, {
            method: 'PUT',
            headers: info.headers,
            body: file
          });
        })
      );

      await upscaleAPI.startJob(created.id);
      setJobId(created.id);
      setStatus('processing');
      setOverallProgress(0);
      setFiles((prev) =>
        prev.map((file, index) => ({
          ...file,
          id: created.files[index]?.item_id ?? file.id,
          status: 'processing',
          progress: 0
        }))
      );
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to start UpScale job', error);
      setStatus('files_added');
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (!jobId) return;
    let cancelled = false;
    const interval = setInterval(async () => {
      try {
        const job = await upscaleAPI.getJob(jobId);
        if (cancelled) return;

        setOverallProgress(job.progress ?? 0);
        setFiles((prev) =>
          prev.map((file) => {
            const item = job.items.find((i) => i.id === file.id || i.original_name === file.name);
            if (!item) return file;
            const mappedStatus =
              item.status === 'completed'
                ? 'completed'
                : item.status === 'failed'
                  ? 'failed'
                  : item.status === 'processing'
                    ? 'processing'
                    : 'queued';
            return {
              ...file,
              status: mappedStatus,
              progress: typeof item.progress === 'number' ? item.progress : file.progress
            };
          })
        );

        if (job.status === 'completed' || job.progress >= 100) {
          setStatus('completed');
          setJobId(null);
          clearInterval(interval);
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Failed to poll UpScale job', error);
      }
    }, 2000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [jobId]);

  return (
    <div className="flex-1 flex flex-col w-full max-w-7xl mx-auto p-6 relative z-10 mt-16">
      {/* Header */}
      <div className="mb-8 flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2 tracking-tight flex items-center gap-3">
            UpScale{' '}
            <span className="text-[10px] uppercase tracking-widest font-bold bg-app-primary/20 text-app-primary px-2 py-1 rounded-md border border-app-primary/30">
              Pro Workspace
            </span>
          </h1>
          <p className="text-app-muted">
            Premium media processing, resolution upscaling, and format conversion.
          </p>
        </div>
        {/* (Optional) debug state toggle was here; removed from production to avoid mock feeling */}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative">
        {/* Locked Overlay */}
        <AnimatePresence>
          {status === 'locked' && (
            <motion.div
              initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
              animate={{ opacity: 1, backdropFilter: 'blur(12px)' }}
              exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
              className="absolute inset-0 z-50 flex items-center justify-center bg-[#050505]/60 rounded-3xl"
            >
              <div className="max-w-md w-full glass-panel border border-white/10 rounded-3xl p-8 text-center flex flex-col items-center shadow-2xl">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-app-primary to-red-900 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(165,0,52,0.3)]">
                  <Lock className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-3">UpScale is a Premium Feature</h2>
                <p className="text-app-muted mb-8 text-sm leading-relaxed">
                  Upgrade to Pro or Ultra to access AI-powered resolution upscaling, format
                  conversion, and batch media processing workflows.
                </p>
                <button className="w-full py-3 bg-white text-black font-medium rounded-xl hover:bg-white/90 transition-colors shadow-[0_0_20px_rgba(255,255,255,0.2)]">
                  View Plans & Upgrade
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Left/Main Column: Upload & Queue */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Completed State Banner */}
          <AnimatePresence>
            {status === 'completed' && (
              <motion.div
                initial={{ opacity: 0, y: -20, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                className="glass-panel border border-emerald-500/30 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between bg-emerald-500/5 relative overflow-hidden gap-4"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-transparent pointer-events-none" />
                <div className="flex items-center gap-4 relative z-10">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">Batch Processing Complete</h3>
                    <p className="text-sm text-emerald-400/80">
                      {files.length} files successfully processed
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 relative z-10 w-full sm:w-auto">
                  <button className="flex-1 sm:flex-none px-4 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl text-sm font-medium transition-colors border border-white/5">
                    View Files
                  </button>
                  <button className="flex-1 sm:flex-none px-4 py-2.5 bg-emerald-500 text-white hover:bg-emerald-400 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                    <FileArchive className="w-4 h-4" />
                    Download ZIP
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Upload Zone (Hidden when files exist) */}
          {status === 'empty' && (
            <div
              onClick={handleUploadClick}
              className="glass-panel border border-white/5 rounded-3xl p-12 flex flex-col items-center justify-center text-center border-dashed hover:bg-white/5 hover:border-app-primary/50 transition-all cursor-pointer group relative overflow-hidden min-h-[400px]"
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={(e) => handleFilesSelected(e.target.files)}
              />
              <div className="absolute inset-0 bg-gradient-to-b from-app-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="w-20 h-20 rounded-3xl bg-white/5 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-app-primary/20 transition-all shadow-[0_0_20px_rgba(255,255,255,0.05)] group-hover:shadow-[0_0_30px_rgba(165,0,52,0.2)]">
                <UploadCloud className="w-10 h-10 text-app-muted group-hover:text-app-primary transition-colors" />
              </div>
              <h3 className="text-2xl font-semibold text-white mb-3">Drop files or folders here</h3>
              <p className="text-app-muted mb-8 max-w-md text-sm leading-relaxed">
                Supports MP4, MKV, MOV, WEBM and other common video formats. Process up to 50GB per
                batch on Ultra.
              </p>
              <button
                type="button"
                onClick={handleUploadClick}
                className="px-8 py-3 bg-white/10 group-hover:bg-white/20 text-white rounded-xl font-medium transition-colors"
              >
                Browse Files
              </button>
            </div>
          )}

          {/* File Queue */}
          {status !== 'empty' && (
            <div className="glass-panel border border-white/5 rounded-3xl flex flex-col overflow-hidden">
              <div className="p-5 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                <h3 className="font-medium text-white flex items-center gap-2">
                  <FileVideo className="w-4 h-4 text-app-primary" />
                  Processing Queue
                </h3>
                <div className="flex items-center gap-3">
                  {status === 'processing' && (
                    <div className="flex items-center gap-2 text-xs font-medium text-app-primary bg-app-primary/10 px-3 py-1.5 rounded-lg">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Processing {Math.round(overallProgress)}%
                    </div>
                  )}
                  <span className="text-xs font-medium text-app-muted bg-white/10 px-3 py-1.5 rounded-lg">
                    {files.length} files
                  </span>
                </div>
              </div>

              {status === 'processing' && (
                <div className="h-1 w-full bg-white/5">
                  <motion.div
                    className="h-full bg-app-primary shadow-[0_0_10px_rgba(165,0,52,0.5)]"
                    style={{ width: `${overallProgress}%` }}
                  />
                </div>
              )}

              <div className="divide-y divide-white/5">
                {files.map((file) => (
                  <div
                    key={file.id}
                    className="p-5 flex flex-col sm:flex-row sm:items-center gap-4 hover:bg-white/[0.02] transition-colors relative overflow-hidden"
                  >
                    {/* Item Progress Background */}
                    {status === 'processing' && file.status === 'processing' && (
                      <div
                        className="absolute inset-0 bg-app-primary/5 pointer-events-none transition-all duration-300"
                        style={{ width: `${file.progress}%` }}
                      />
                    )}

                    <div className="w-12 h-12 rounded-xl bg-black/50 flex items-center justify-center shrink-0 border border-white/5 relative z-10">
                      {file.status === 'completed' ? (
                        <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                      ) : file.status === 'processing' ? (
                        <Loader2 className="w-6 h-6 text-app-primary animate-spin" />
                      ) : (
                        <Video className="w-6 h-6 text-app-muted" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0 flex flex-col gap-1.5 relative z-10">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-white truncate pr-4">
                          {file.name}
                        </span>
                        <span className="text-xs font-medium text-app-muted shrink-0">
                          {file.size}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-app-muted">
                        <span className="flex items-center gap-1.5">
                          <Monitor className="w-3.5 h-3.5" /> {file.res}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" /> {file.duration}
                        </span>
                        <span className="uppercase tracking-wider font-semibold bg-white/5 px-2 py-0.5 rounded text-white/70">
                          {file.format}
                        </span>

                        {status === 'processing' && (
                          <span
                            className={`ml-auto font-medium ${
                              file.status === 'completed'
                                ? 'text-emerald-500'
                                : file.status === 'processing'
                                  ? 'text-app-primary'
                                  : 'text-app-muted'
                            }`}
                          >
                            {file.status === 'completed'
                              ? 'Done'
                              : file.status === 'processing'
                                ? `${Math.round(file.progress)}%`
                                : 'Queued'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {status === 'files_added' && (
                <div className="p-4 border-t border-white/5 bg-white/[0.02] flex justify-center">
                  <button className="text-xs font-medium text-app-muted hover:text-white transition-colors flex items-center gap-1">
                    + Add more files
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Settings & Plan */}
        <div className="flex flex-col gap-6">
          {/* Processing Settings */}
          <div className="glass-panel border border-white/5 rounded-3xl p-6 flex flex-col gap-6">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-app-primary/20 flex items-center justify-center text-app-primary">
                  <Settings2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">Processing mode</h3>
                  <p className="text-xs text-app-muted">Single-step upscale pipeline, ready for 4K.</p>
                </div>
              </div>
              <span className="text-[10px] uppercase tracking-[0.16em] font-semibold text-app-muted flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-app-primary" />
                Pipeline-Ready
              </span>
            </div>

            {/* Mode (single option for now) */}
            <div className="flex flex-col gap-2">
              <span className="text-[10px] uppercase tracking-[0.18em] text-app-muted">Mode</span>
              <div className="inline-flex items-center gap-2 rounded-full bg-black/40 border border-white/10 px-1 py-1 text-[11px] w-fit">
                <button
                  type="button"
                  className="px-3 py-1 rounded-full text-xs font-semibold bg-white text-black flex items-center gap-1.5"
                >
                  <Monitor className="w-3.5 h-3.5" />
                  Upscale
                  <span className="ml-1 text-[8px] uppercase tracking-[0.18em] px-1.5 py-0.5 rounded-full bg-[#981b3c] text-white">
                    4K
                  </span>
                </button>
              </div>
            </div>

            {/* Target quality */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-[0.18em] text-app-muted">Target quality</span>
              </div>
              <select
                value={targetResolution}
                onChange={(e) => setTargetResolution(e.target.value as TargetResolution)}
                className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-app-primary/60"
              >
                <option value="720p">720p</option>
                <option value="1080p">1080p</option>
                <option value="1440p">1440p</option>
                <option value="4k">4K</option>
              </select>
            </div>

            {/* Output format */}
            <div className="flex flex-col gap-2">
              <span className="text-[10px] uppercase tracking-[0.18em] text-app-muted">Output format</span>
              <div className="flex flex-wrap gap-2">
                {(['mp4', 'mkv', 'mov', 'webm'] as TargetFormat[]).map((fmt) => {
                  const isActive = targetFormat === fmt;
                  return (
                    <button
                      key={fmt}
                      type="button"
                      onClick={() => setTargetFormat(fmt)}
                      className={`px-3 py-1.5 rounded-full text-[11px] font-medium transition-colors ${
                        isActive
                          ? 'bg-white text-black'
                          : 'bg-white/5 text-app-muted hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      {fmt.toUpperCase()}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Plan / Limits */}
          <div className="glass-panel border border-white/5 rounded-3xl p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-semibold text-white mb-1">Workspace limits</h3>
                <p className="text-xs text-app-muted">
                  Designed for heavy creators, editors and agencies.
                </p>
              </div>
              <button className="flex items-center gap-2 text-xs font-medium text-app-primary hover:text-white transition-colors">
                Upgrade workspace
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-[11px] text-app-muted">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] uppercase tracking-[0.18em] font-semibold text-app-muted/80">
                  Max batch size
                </span>
                <span className="text-sm font-semibold text-white">50 GB</span>
                <span>Per batch on Ultra plan.</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] uppercase tracking-[0.18em] font-semibold text-app-muted/80">
                  Parallel jobs
                </span>
                <span className="text-sm font-semibold text-white">Up to 20x</span>
                <span>Fair-use throttling for providers.</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] uppercase tracking-[0.18em] font-semibold text-app-muted/80">
                  Archive retention
                </span>
                <span className="text-sm font-semibold text-white">7 days</span>
                <span>Auto-cleanup for processed assets.</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] uppercase tracking-[0.18em] font-semibold text-app-muted/80">
                  API & Webhooks
                </span>
                <span className="text-sm font-semibold text-white">Workspace-wide</span>
                <span>Full automation and CI integration.</span>
              </div>
            </div>
          </div>

          {/* Summary / CTA */}
          <div className="glass-panel border border-white/5 rounded-3xl p-6 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-app-primary/20 flex items-center justify-center text-app-primary">
                <Play className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white mb-1">Run this workspace</h3>
                <p className="text-xs text-app-muted">
                  Queue all files with current settings. You can close the tab; we&apos;ll finish in
                  the background.
                </p>
              </div>
            </div>

            <button
              type="button"
              disabled={status === 'processing' || files.length === 0 || isSubmitting}
              onClick={startProcessing}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-app-primary text-white hover:bg-app-primary/90 disabled:bg-white/5 disabled:text-app-muted transition-all shadow-[0_0_20px_rgba(165,0,52,0.4)]"
            >
              {status === 'processing' || isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {status === 'processing' ? 'Processing...' : 'Starting...'}
                </>
              ) : (
                <>
                  <Cpu className="w-4 h-4" />
                  Start processing
                </>
              )}
            </button>

            <div className="flex items-center gap-2 text-[11px] text-app-muted">
              <XCircle className="w-3.5 h-3.5" />
              <span>
                This is a preview workspace. Actual processing runs on BatchTube backend queues and
                respects your plan limits.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

