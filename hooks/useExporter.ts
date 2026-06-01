import React, { useState, useRef, useEffect } from "react";
import { Track, VisualizerSettings, VisualizerMode } from "../types";
import { renderService } from "../services/render/renderService";

interface ExportStats {
  current: number;
  total: number;
  phase: string;
}

export const useExporter = (
  tracks: Track[],
  currentTrack: Track | null,
  audioRef: React.RefObject<HTMLAudioElement>,
  setIsPlaying: (playing: boolean) => void,
  visualizerSettings: VisualizerSettings,
  visualizerMode: VisualizerMode | null,
) => {
  const [isExporting, setIsExporting] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportStats, setExportStats] = useState<ExportStats>({
    current: 0,
    total: 0,
    phase: "",
  });
  const [exportFormat, setExportFormat] = useState<"mp4" | "webm">("mp4");
  const [downloadReady, setDownloadReady] = useState<{url: string, filename: string} | null>(null);

  const isExportingRef = useRef(isExporting);
  useEffect(() => {
    isExportingRef.current = isExporting;
  }, [isExporting]);

  // Prevent accidental tab closure during export
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isExportingRef.current) {
        e.preventDefault();
        e.returnValue = ""; // Legacy standard for Chrome
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  const triggerExportModal = () => {
    if (tracks.length === 0) {
      alert("내보낼 트랙이 없습니다.");
      return;
    }

    setExportStats({
      current: 0,
      total: tracks.length,
      phase: "준비 중...",
    });
    setExportFormat("mp4");
    setShowExportModal(true);
  };

  const startPlaylistExport = async () => {
    // 1. Pause Audio & Setup
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setIsPlaying(false);

    if (tracks.length === 0) {
      alert("내보낼 트랙이 없습니다.");
      return;
    }

    // 2. Ask for File Save Location (Direct-to-Disk or OPFS)
    let fileHandle: any = null;
    let useOPFS = false;
    let useInMemoryFallback = false;
    
    const now = new Date();
    const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;
    const filename = `SpectrumStudio_Export_${dateStr}.${exportFormat}`;

    if ("showSaveFilePicker" in window) {
      try {
        fileHandle = await (window as any).showSaveFilePicker({
          suggestedName: filename,
          types: [
            {
              description: exportFormat === "mp4" ? "MP4 Video File" : "WebM Video File",
              accept: exportFormat === "mp4" ? { "video/mp4": [".mp4"] } : { "video/webm": [".webm"] },
            },
          ],
        });
      } catch (err: any) {
        // User cancelled the picker
        if (err.name === "AbortError") return;
        console.warn("File picker failed:", err);
      }
    }

    // Fallback to OPFS (Origin Private File System) if File Picker failed (e.g. in iframe)
    if (!fileHandle && navigator.storage && navigator.storage.getDirectory) {
      try {
        const dir = await navigator.storage.getDirectory();
        fileHandle = await dir.getFileHandle(filename, { create: true });
        useOPFS = true;
        console.log("Using OPFS for direct-to-disk export");
      } catch (err) {
        console.warn("OPFS failed:", err);
      }
    }

    if (!fileHandle) {
       useInMemoryFallback = true;
       console.log("Using in-memory fallback for export.");
    }

    // 3. Close Modal & Start Process
    setShowExportModal(false);
    setIsExporting(true);
    setDownloadReady(null);

    try {
      const result = await renderService.renderPlaylist(
        tracks,
        visualizerSettings,
        visualizerMode,
        visualizerSettings.resolution || "1080p",
        exportFormat,
        (current, total, phase) => {
          setExportStats({ current, total, phase });
        },
        fileHandle
      );

      if (result && result.url) {
        // Fallback for browsers without File System Access API (in-memory render)
        setDownloadReady({ url: result.url, filename: result.filename });
      } else if (fileHandle) {
        if (useOPFS) {
          // Extract file from OPFS and trigger download
          setExportStats({ current: 1, total: 1, phase: "파일 다운로드 준비 중..." });
          const file = await fileHandle.getFile();
          const url = URL.createObjectURL(file);
          setDownloadReady({ url, filename });
        } else {
          // Direct-to-disk via showSaveFilePicker completed successfully
          alert("파일 저장이 완료되었습니다.");
          setIsExporting(false);
        }
      }
    } catch (e: any) {
      console.error("Export Fatal Error:", e);
      alert(`렌더링 중 오류가 발생했습니다: ${e.message}`);
      setIsExporting(false);
    }
  };

  const closeDownload = () => {
    if (downloadReady) {
      URL.revokeObjectURL(downloadReady.url);
      setDownloadReady(null);
    }
    setIsExporting(false);
  };

  const cancelExport = () => {
    renderService.cancel();
    setIsExporting(false);
    setDownloadReady(null);
  };

  return {
    isExporting,
    showExportModal,
    setShowExportModal,
    exportStats,
    exportFormat,
    setExportFormat,
    triggerExportModal,
    startPlaylistExport,
    cancelExport,
    downloadReady,
    closeDownload,
  };
};
