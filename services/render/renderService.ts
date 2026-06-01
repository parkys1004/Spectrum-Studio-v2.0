// @ts-nocheck
import { Track, VisualizerSettings, VisualizerMode } from "../../types";
import { EffectRenderer } from "../../utils/effectRenderer";
import { renderSpectrum } from "./spectrumRenderer";
import { loadAudioBuffers } from "./audioDecoder";
import { setupEncoders } from "./encoderSetup";
import { loadAssets } from "./assetLoader";

class RenderService {
  private abortController: AbortController | null = null;
  private hasEncoderError = false;

  // Helper to wait for encoder queue to drain (Backpressure)
  private async waitForQueue(
    encoder: any,
    limit: number,
  ) {
    if (encoder.encodeQueueSize > limit) {
      await new Promise<void>((resolve) => {
        const listener = () => {
          if (encoder.encodeQueueSize < limit / 2) {
            encoder.removeEventListener("dequeue", listener);
            resolve();
          }
        };
        encoder.addEventListener("dequeue", listener);
      });
    }
  }

  async renderPlaylist(
    tracks: Track[],
    visualizerSettings: VisualizerSettings,
    visualizerMode: VisualizerMode | null,
    resolution: "1080p" | "720p" | "1080p_vertical" | "720p_vertical" | "1080p_square",
    format: "mp4" | "webm" = "mp4",
    onProgress: (current: number, total: number, phase: string) => void,
    fileHandle?: any
  ): Promise<{ url: string; filename: string } | null> {
    this.abortController = new AbortController();
    this.hasEncoderError = false;
    const signal = this.abortController.signal;

    if (tracks.length === 0) throw new Error("No tracks to render");

    // 1. Load Audio Buffers (Parallelized Batch Loading)
    const { validBuffers, totalDuration } = await loadAudioBuffers(tracks, signal, onProgress);

    // 2. Setup Offline Context
    const sampleRate = 48000; // 48000Hz is required for Opus codec (WebM)
    const frameCount = Math.ceil(sampleRate * totalDuration);

    let offlineCtx: OfflineAudioContext;
    try {
      offlineCtx = new OfflineAudioContext(2, frameCount, sampleRate);
    } catch (e) {
      throw new Error(
        "메모리 부족으로 오디오 처리를 시작할 수 없습니다. 트랙 수를 줄여 다시 시도해주세요.",
      );
    }

    // 4. Setup Visualization Environment
    const analyser = offlineCtx.createAnalyser();
    analyser.fftSize = 2048;
    analyser.smoothingTimeConstant = visualizerSettings.sensitivity;

    const frequencyDataHistory: { time: number; freq: Uint8Array; timeDomain: Uint8Array }[] = [];
    
    // Use ScriptProcessor for fast offline analysis without suspend/resume overhead
    const bufferSize = 1024;
    const scriptProcessor = offlineCtx.createScriptProcessor(bufferSize, 2, 2);
    
    const isTimeDomainMode = visualizerMode === VisualizerMode.FLUID || visualizerMode === VisualizerMode.JELLY_WAVE;
    
    scriptProcessor.onaudioprocess = (e) => {
      const time = e.playbackTime;
      const data = new Uint8Array(analyser.frequencyBinCount);
      
      if (isTimeDomainMode) {
        analyser.getByteTimeDomainData(data);
        frequencyDataHistory.push({ time, freq: null, timeDomain: data });
      } else {
        analyser.getByteFrequencyData(data);
        frequencyDataHistory.push({ time, freq: data, timeDomain: null });
      }

      // Pass audio through to prevent silent output
      for (let channel = 0; channel < e.outputBuffer.numberOfChannels; channel++) {
        e.outputBuffer.copyToChannel(e.inputBuffer.getChannelData(channel), channel);
      }
    };
    
    let offset = 0;
    validBuffers.forEach((buf) => {
      const source = offlineCtx.createBufferSource();
      source.buffer = buf;
      source.connect(analyser); // Connect source to analyser
      source.start(offset);
      offset += buf.duration;
    });
    
    analyser.connect(scriptProcessor);
    scriptProcessor.connect(offlineCtx.destination);
    const fps = 30;

    let fileStream: any = null;
    if (fileHandle) {
      fileStream = await fileHandle.createWritable();
    }

    const { muxer, videoEncoder, audioEncoder, width, height } = await setupEncoders(
      format,
      resolution,
      fps,
      sampleRate,
      fileStream, // Pass fileStream to enable direct-to-disk muxing
      (e: any) => {
        console.error("Encoder Error", e);
        this.hasEncoderError = true;
      }
    );

    // SCALING LOGIC:
    // The design/preview canvas is responsive, but we use the max dimension to scale.
    const scaleFactor = Math.max(width, height) / 1920;

    const scaledSettings: VisualizerSettings = {
      ...visualizerSettings,
      lineThickness: visualizerSettings.lineThickness * scaleFactor,
      positionX: visualizerSettings.positionX * scaleFactor,
      positionY: visualizerSettings.positionY * scaleFactor,
    };

    // 3. Setup Muxer & Encoders

    const canvas = new OffscreenCanvas(width, height);
    const ctx = canvas.getContext("2d", {
      alpha: false,
      desynchronized: true,
    })!;

    const effectRenderer = new EffectRenderer();
    effectRenderer.resize(width, height);

    // --- Load Assets (Async) ---
    const { bgBitmap, logoBitmap, stickerBitmap, gifController, bgGifController } = await loadAssets(visualizerSettings);

    // --- Pre-render Static Background ---
    const bgCanvas = new OffscreenCanvas(width, height);
    const bgCtx = bgCanvas.getContext("2d", { alpha: false })!;
    let hasBgImage = false;
    let bgBitmapFinal: ImageBitmap | null = null;
    if (!bgGifController.isLoaded) {
      if (bgBitmap) {
        hasBgImage = true;
        const r = bgBitmap.width / bgBitmap.height;
        const cr = width / height;
        let dw, dh, ox, oy;
        if (cr > r) {
          dw = width;
          dh = width / r;
          ox = 0;
          oy = (height - dh) / 2;
        } else {
          dw = height * r;
          dh = height;
          ox = (width - dw) / 2;
          oy = 0;
        }
        bgCtx.drawImage(bgBitmap, ox, oy, dw, dh);
        bgBitmapFinal = bgCanvas.transferToImageBitmap();
      }
    }

    // --- Pre-render Foreground (Logo & Static Sticker) ---
    const fgCanvas = new OffscreenCanvas(width, height);
    const fgCtx = fgCanvas.getContext("2d")!;
    let hasFg = false;
    let fgBitmapFinal: ImageBitmap | null = null;
    if (logoBitmap) {
      hasFg = true;
      const base = Math.min(width, height) * 0.15;
      const dw = base * visualizerSettings.logoScale;
      const dh = dw / (logoBitmap.width / logoBitmap.height);
      const x = (width - dw) * (visualizerSettings.logoX / 100);
      const y = (height - dh) * (visualizerSettings.logoY / 100);
      fgCtx.globalAlpha = 0.9;
      fgCtx.drawImage(logoBitmap, x, y, dw, dh);
      fgCtx.globalAlpha = 1.0;
    }
    if (stickerBitmap && !gifController.isLoaded) {
      hasFg = true;
      const base = Math.min(width, height) * 0.15;
      const dw = base * visualizerSettings.stickerScale;
      const dh = dw / (stickerBitmap.width / stickerBitmap.height);
      const x = (width - dw) * (visualizerSettings.stickerX / 100);
      const y = (height - dh) * (visualizerSettings.stickerY / 100);
      fgCtx.drawImage(stickerBitmap, x, y, dw, dh);
    }
    if (hasFg) {
      fgBitmapFinal = fgCanvas.transferToImageBitmap();
    }

      // 5. Render Processor
      const totalFrames = Math.ceil(totalDuration * fps);
      let startTime = 0;
      let lastYieldTime = 0;

      try {
        // --- Start Audio Processing ---
        onProgress(0, totalFrames, "오디오 고속 분석 중...");
        const renderedBuffer = await offlineCtx.startRendering();

        // --- Start Video Rendering ---
        startTime = performance.now();
        lastYieldTime = startTime;
        
        let historyIndex = 0;
        
        const audioLeft = renderedBuffer.getChannelData(0);
        const audioRight = renderedBuffer.getChannelData(1);
        const totalAudioFrames = renderedBuffer.length;
        let currentAudioFrame = 0;
        
        for (let i = 0; i < totalFrames; i++) {
          if (signal.aborted || this.hasEncoderError) {
            break;
          }

          if (videoEncoder.encodeQueueSize > 500) {
            await this.waitForQueue(videoEncoder, 500);
          }
          if (audioEncoder.encodeQueueSize > 200) {
            await this.waitForQueue(audioEncoder, 200);
          }

          // --- Interleaved Audio Encoding ---
          const targetAudioFrame = Math.min(
            Math.floor((i + 1) * (sampleRate / fps)),
            totalAudioFrames
          );

          if (targetAudioFrame > currentAudioFrame) {
            const framesToEncode = targetAudioFrame - currentAudioFrame;
            const chunkBuffer = new Float32Array(framesToEncode * 2);
            for (let j = 0; j < framesToEncode; j++) {
              chunkBuffer[j * 2] = audioLeft[currentAudioFrame + j];
              chunkBuffer[j * 2 + 1] = audioRight[currentAudioFrame + j];
            }

            try {
              const audioData = new AudioData({
                format: "f32",
                sampleRate: sampleRate,
                numberOfFrames: framesToEncode,
                numberOfChannels: 2,
                timestamp: (currentAudioFrame / sampleRate) * 1_000_000,
                data: chunkBuffer,
              });
              audioEncoder.encode(audioData);
              audioData.close();
            } catch (e) {
              console.error("Audio encode error", e);
            }
            currentAudioFrame = targetAudioFrame;
          }

          const now = performance.now();
          if (now - lastYieldTime > 100) {
            const elapsed = (now - startTime) / 1000;
            let speedInfo = "";
            if (elapsed > 1.0) {
              const processedDuration = i / fps;
              const speed = (processedDuration / elapsed).toFixed(1);
              speedInfo = ` (🚀 x${speed})`;
            }
            const percent = Math.round((i / totalFrames) * 100);
            onProgress(i, totalFrames, `렌더링 중... ${percent}%${speedInfo}`);
            await new Promise((r) => setTimeout(r, 0));
            lastYieldTime = performance.now();
          }

          const timeSeconds = i / fps;
          const timeMs = timeSeconds * 1000;

        // Find closest frequency data efficiently
        while (
          historyIndex < frequencyDataHistory.length - 1 &&
          frequencyDataHistory[historyIndex + 1].time <= timeSeconds
        ) {
          historyIndex++;
        }
        
        let closestData = frequencyDataHistory[historyIndex];

        let dataArray = new Uint8Array(analyser.frequencyBinCount);
        if (closestData) {
          if (isTimeDomainMode) {
            dataArray = closestData.timeDomain || dataArray;
          } else {
            dataArray = closestData.freq || dataArray;
          }
        }

        let bassEnergy = 0;
        if (
          visualizerMode !== VisualizerMode.FLUID &&
          visualizerMode !== VisualizerMode.JELLY_WAVE
        ) {
          bassEnergy =
            (dataArray[0] +
              dataArray[1] +
              dataArray[2] +
              dataArray[3] +
              dataArray[4]) /
            5;
        } else {
          let sum = 0;
          const step = 4;
          for (let k = 0; k < dataArray.length; k += step)
            sum += Math.abs(dataArray[k] - 128);
          bassEnergy = (sum / (dataArray.length / step)) * 2;
        }

        // Lowered threshold for export as well
        const isBeat = bassEnergy > 140;

        const fixedDeltaTime = 1.0 / fps;
        effectRenderer.update(
          isBeat,
          bassEnergy,
          visualizerSettings.effectParams,
          fixedDeltaTime,
        );

        ctx.save();
        if (visualizerSettings.effects.shake && isBeat) {
          const s = visualizerSettings.effectParams.shakeStrength || 1;
          const shakeRange = 30 * scaleFactor; // Matched Visualizer.tsx range
          ctx.translate(
            (Math.random() - 0.5) * shakeRange * s,
            (Math.random() - 0.5) * shakeRange * s,
          );
        }
        if (visualizerSettings.effects.pulse) {
          const zoom = 1.0 + (bassEnergy / 255) * 0.1;
          ctx.translate(width / 2, height / 2);
          ctx.scale(zoom, zoom);
          ctx.translate(-width / 2, -height / 2);
        }

        // Background
        if (bgGifController.isLoaded || (visualizerSettings.effects.shake && isBeat) || !hasBgImage) {
          // Clear Canvas for safety when using dynamic GIF background or when shaking exposes edges
          ctx.fillStyle = "#111111";
          ctx.fillRect(-width, -height, width * 3, height * 3); // Clear larger area just in case of transform
        }

        if (bgGifController.isLoaded) {
          await bgGifController.seekVideo(timeMs);
          const bgFrame = bgGifController.getFrame(timeMs);
          if (bgFrame) {
            const bgWidth = (bgFrame as any).videoWidth || (bgFrame as any).width;
            const bgHeight = (bgFrame as any).videoHeight || (bgFrame as any).height;
            const r = bgWidth / bgHeight;
            const cr = width / height;
            let dw, dh, ox, oy;
            if (cr > r) {
              dw = width;
              dh = width / r;
              ox = 0;
              oy = (height - dh) / 2;
            } else {
              dw = height * r;
              dh = height;
              ox = (width - dw) / 2;
              oy = 0;
            }
            ctx.drawImage(bgFrame, ox, oy, dw, dh);
          }
        } else if (hasBgImage && bgBitmapFinal) {
          ctx.drawImage(bgBitmapFinal, 0, 0);
        }

        // Spectrum
        ctx.save();
        ctx.translate(width / 2, height / 2);
        ctx.translate(scaledSettings.positionX, scaledSettings.positionY);
        ctx.scale(scaledSettings.scale, scaledSettings.scale);

        if (visualizerSettings.effects.mirror) {
          ctx.save();
          ctx.translate(0, -height / 2);
          renderSpectrum(visualizerMode, ctx, dataArray, width / 2, height, scaledSettings, timeMs);
          ctx.restore();

          ctx.save();
          ctx.scale(-1, 1);
          ctx.translate(0, -height / 2);
          ctx.globalCompositeOperation = "screen";
          renderSpectrum(visualizerMode, ctx, dataArray, width / 2, height, scaledSettings, timeMs);
          ctx.restore();
        } else {
          ctx.translate(-width / 2, -height / 2);
          renderSpectrum(visualizerMode, ctx, dataArray, width, height, scaledSettings, timeMs);
        }
        ctx.restore();

        // Pre-rendered Foreground (Logo & Static Sticker)
        if (hasFg && fgBitmapFinal) {
          ctx.drawImage(fgBitmapFinal, 0, 0);
        }

        // Dynamic Sticker (GIF)
        if (gifController.isLoaded) {
          const sImg = gifController.getFrame(timeMs) as ImageBitmap;
          if (sImg) {
            const base = Math.min(width, height) * 0.15;
            const dw = base * visualizerSettings.stickerScale;
            const dh = dw / (sImg.width / sImg.height);
            const x = (width - dw) * (visualizerSettings.stickerX / 100);
            const y = (height - dh) * (visualizerSettings.stickerY / 100);
            ctx.drawImage(sImg, x, y, dw, dh);
          }
        }

        effectRenderer.draw(ctx, visualizerSettings.effects);

        if (visualizerSettings.effects.glitch && isBeat) {
          const glStr = visualizerSettings.effectParams.glitchStrength || 1.0;
          const sliceHeight = (Math.random() * 50 + 10) * scaleFactor;
          const sliceY = Math.random() * height;
          const offset = (Math.random() - 0.5) * 40 * glStr * scaleFactor;
          try {
            ctx.drawImage(
              canvas,
              0,
              sliceY,
              width,
              sliceHeight,
              offset,
              sliceY,
              width,
              sliceHeight,
            );
            ctx.fillStyle = `rgba(255, 0, 0, ${0.2 * glStr})`;
            ctx.fillRect(0, sliceY, width, 5);
          } catch (e) {}
        }

        ctx.restore();

        const frame = new VideoFrame(canvas, {
          timestamp: i * (1_000_000 / fps),
          duration: 1_000_000 / fps,
          alpha: "discard"
        });

        try {
          const keyFrame = i % 150 === 0;
          videoEncoder.encode(frame, { keyFrame });
        } catch (e) {
          console.error("Frame encoding failed", e);
        }
        frame.close();
      }

      // --- Finalize Video & Audio ---
      onProgress(totalFrames, totalFrames, "비디오 및 오디오 인코딩 정리 중...");
      try {
        if (videoEncoder.state !== "closed") {
          await videoEncoder.flush();
        }
      } catch (e) {
        console.warn("Video flush warning:", e);
      }
      if (videoEncoder.state !== "closed") {
        videoEncoder.close();
      }

      try {
        if (audioEncoder.state !== "closed") {
          await audioEncoder.flush();
        }
      } catch (e) {
        console.warn("Audio flush warning:", e);
      }
      if (audioEncoder.state !== "closed") {
        audioEncoder.close();
      }

      if (this.hasEncoderError) {
        throw new Error("인코딩 중 오류가 발생했습니다.");
      }

      try {
        await muxer.finalize();
      } catch (e) {
        console.error("Muxer finalize error", e);
        throw new Error("파일 생성 마무리 단계에서 오류가 발생했습니다.");
      }

      if (bgBitmap) bgBitmap.close();
      if (logoBitmap) logoBitmap.close();
      if (stickerBitmap) stickerBitmap.close();
      if (bgBitmapFinal) bgBitmapFinal.close();
      if (fgBitmapFinal) fgBitmapFinal.close();
      gifController.dispose();
      bgGifController.dispose();

      if (fileStream) {
        // Direct-to-disk: File is already written incrementally via StreamTarget
        try {
          await fileStream.close();
        } catch (e) {
          console.error("Failed to close fileStream", e);
          throw new Error("파일 저장 마무리 중 오류가 발생했습니다.");
        }
        return { url: "", filename: "" };
      }

      const { buffer } = muxer.target as any;
      if (!buffer || buffer.byteLength === 0) {
        throw new Error(
          "생성된 파일 크기가 0바이트입니다. 메모리 부족 또는 인코딩 오류일 수 있습니다.",
        );
      }

      const blob = new Blob([buffer], {
        type: format === "mp4" ? "video/mp4" : "video/webm",
      });

      // In-memory: Return blob URL
      const url = URL.createObjectURL(blob);

      const now = new Date();
      const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;

      // Return valid blob URL to be saved by the UI
      return { url, filename: `SpectrumStudio_Export_${dateStr}.${format}` };
    } catch (e) {
      console.error("Rendering Process Failed", e);
      if (fileStream) {
        try {
          await fileStream.close();
        } catch (closeError) {
          console.warn("Failed to close fileStream on error", closeError);
        }
      }
      try {
        if (videoEncoder.state !== "closed") {
          videoEncoder.close();
        }
      } catch {}
      try {
        if (audioEncoder.state !== "closed") {
          audioEncoder.close();
        }
      } catch {}
      throw e;
    }
  }

  cancel() {
    if (this.abortController) this.abortController.abort();
  }
}

export const renderService = new RenderService();
