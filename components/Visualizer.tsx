import React, {
  useRef,
  useEffect,
  useImperativeHandle,
  forwardRef,
} from "react";
import { audioService } from "../services/audioService";
import { VisualizerMode, VisualizerSettings } from "../types";
import { EffectRenderer } from "../utils/effectRenderer";
import { GifController } from "../utils/gifUtils";
import { renderSpectrum } from "../services/render/spectrumRenderer";

interface VisualizerProps {
  isPlaying: boolean;
  mode: VisualizerMode | null;
  settings: VisualizerSettings;
}

const Visualizer = forwardRef<HTMLCanvasElement, VisualizerProps>(
  ({ isPlaying, mode, settings }, ref) => {
    const internalCanvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const animationRef = useRef<number | null>(null);

    const lastTimeRef = useRef<number>(0);
    const animationTimeRef = useRef<number>(0);

    const bgImageRef = useRef<HTMLImageElement | null>(null);
    const logoImageRef = useRef<HTMLImageElement | null>(null);
    const stickerImageRef = useRef<HTMLImageElement | null>(null);

    const bgGifControllerRef = useRef<GifController>(new GifController());
    const gifControllerRef = useRef<GifController>(new GifController());
    const effectRendererRef = useRef<EffectRenderer>(new EffectRenderer());

    const settingsRef = useRef(settings);
    useEffect(() => {
      settingsRef.current = settings;
    }, [settings]);

    useImperativeHandle(ref, () => internalCanvasRef.current!, []);

    useEffect(() => {
      if (settings.backgroundImage) {
        const img = new Image();
        img.src = settings.backgroundImage;
        bgImageRef.current = img;
        bgGifControllerRef.current.load(settings.backgroundImage);
      } else {
        bgImageRef.current = null;
        bgGifControllerRef.current.dispose();
      }
    }, [settings.backgroundImage]);

    useEffect(() => {
      if (settings.logoImage) {
        const img = new Image();
        img.src = settings.logoImage;
        logoImageRef.current = img;
      } else {
        logoImageRef.current = null;
      }
    }, [settings.logoImage]);

    useEffect(() => {
      if (settings.stickerImage) {
        const img = new Image();
        img.src = settings.stickerImage;
        stickerImageRef.current = img;
        gifControllerRef.current.load(settings.stickerImage);
      } else {
        stickerImageRef.current = null;
        gifControllerRef.current.dispose();
      }
    }, [settings.stickerImage]);

    useEffect(() => {
      return () => {
        gifControllerRef.current.dispose();
        bgGifControllerRef.current.dispose();
      };
    }, []);

    useEffect(() => {
      if (internalCanvasRef.current) {
        let width = 1920;
        let height = 1080;
        switch (settings.resolution) {
          case "1080p":
            width = 1920;
            height = 1080;
            break;
          case "720p":
            width = 1280;
            height = 720;
            break;
          case "1080p_vertical":
            width = 1080;
            height = 1920;
            break;
          case "720p_vertical":
            width = 720;
            height = 1280;
            break;
          case "1080p_square":
            width = 1080;
            height = 1080;
            break;
        }
        internalCanvasRef.current.width = width;
        internalCanvasRef.current.height = height;
      }
    }, [settings.resolution]);

    useEffect(() => {
      lastTimeRef.current = 0;
      const render = (time: number) => {
        const canvas = internalCanvasRef.current;
        if (!canvas) {
          animationRef.current = requestAnimationFrame(render);
          return;
        }
        if (lastTimeRef.current === 0) lastTimeRef.current = time;
        const deltaTime = time - lastTimeRef.current;
        lastTimeRef.current = time;

        // Update animation time (ms)
        if (isPlaying) {
          animationTimeRef.current += deltaTime;
        }

        // Current Timestamp (ms) to pass to drawers
        const currentTimestamp = animationTimeRef.current;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const width = canvas.width;
        const height = canvas.height;
        const currentSettings = settingsRef.current;

        const scaleFactor = Math.max(width, height) / 1920;
        const scaledSettings: VisualizerSettings = {
          ...currentSettings,
          lineThickness: currentSettings.lineThickness * scaleFactor,
          positionX: currentSettings.positionX * scaleFactor,
          positionY: currentSettings.positionY * scaleFactor,
        };

        effectRendererRef.current.resize(width, height);

        let dataArray: Uint8Array;
        let bufferLength: number;
        if (
          mode === VisualizerMode.FLUID ||
          mode === VisualizerMode.JELLY_WAVE
        ) {
          dataArray = audioService.getWaveformData();
        } else {
          dataArray = audioService.getFrequencyData();
        }
        bufferLength = dataArray.length;

        let bassEnergy = 0;
        if (
          mode !== VisualizerMode.FLUID &&
          mode !== VisualizerMode.JELLY_WAVE
        ) {
          for (let i = 0; i < 10; i++) bassEnergy += dataArray[i];
          bassEnergy /= 10;
        } else {
          let sum = 0;
          // Approximate energy for waveform
          for (let i = 0; i < bufferLength; i += 10)
            sum += Math.abs(dataArray[i] - 128);
          bassEnergy = (sum / (bufferLength / 10)) * 2;
        }
        if (!isPlaying) bassEnergy = 0;

        // Lowered threshold for better responsiveness
        const isBeat = bassEnergy > 140;

        if (isPlaying) {
          // Pass deltaTime in Seconds
          effectRendererRef.current.update(
            isBeat,
            bassEnergy,
            currentSettings.effectParams,
            deltaTime / 1000,
          );
        }

        // Clear Canvas BEFORE transforms to prevent shake artifacts
        ctx.fillStyle = "#000000";
        ctx.fillRect(0, 0, width, height);

        ctx.save();
        if (currentSettings.effects.shake && isBeat) {
          const strength = currentSettings.effectParams.shakeStrength || 1.0;
          const shakeRange = 30 * scaleFactor;
          const shakeX = (Math.random() - 0.5) * shakeRange * strength;
          const shakeY = (Math.random() - 0.5) * shakeRange * strength;
          ctx.translate(shakeX, shakeY);
        }
        if (currentSettings.effects.pulse) {
          const zoom = 1.0 + (bassEnergy / 255) * 0.1;
          ctx.translate(width / 2, height / 2);
          ctx.scale(zoom, zoom);
          ctx.translate(-width / 2, -height / 2);
        }

        // Draw Background
        let bgSource: CanvasImageSource | null = null;
        let bgWidth = 0;
        let bgHeight = 0;

        if (bgGifControllerRef.current.isLoaded) {
          const frame = bgGifControllerRef.current.getFrame(
            animationTimeRef.current,
          );
          if (frame) {
            bgSource = frame;
            bgWidth =
              frame instanceof HTMLVideoElement
                ? frame.videoWidth
                : frame.width;
            bgHeight =
              frame instanceof HTMLVideoElement
                ? frame.videoHeight
                : frame.height;
          }
        } else if (
          bgImageRef.current &&
          bgImageRef.current.complete &&
          bgImageRef.current.naturalWidth > 0
        ) {
          bgSource = bgImageRef.current;
          bgWidth = bgImageRef.current.width;
          bgHeight = bgImageRef.current.height;
        }

        if (bgSource && bgWidth > 0 && bgHeight > 0) {
          const imgRatio = bgWidth / bgHeight;
          const canvasRatio = width / height;
          let drawWidth, drawHeight, offsetX, offsetY;
          if (canvasRatio > imgRatio) {
            drawWidth = width;
            drawHeight = width / imgRatio;
            offsetX = 0;
            offsetY = (height - drawHeight) / 2;
          } else {
            drawWidth = height * imgRatio;
            drawHeight = height;
            offsetX = (width - drawWidth) / 2;
            offsetY = 0;
          }
          ctx.drawImage(bgSource, offsetX, offsetY, drawWidth, drawHeight);
          // Dark overlay removed for cleaner background
        } else {
          // Keep canvas dark gray if no image (already cleared black above, but this adds the "panel" color)
          ctx.fillStyle = "#111111";
          ctx.fillRect(0, 0, width, height);
        }

        ctx.save();
        ctx.translate(width / 2, height / 2);
        ctx.translate(scaledSettings.positionX, scaledSettings.positionY);
        ctx.scale(scaledSettings.scale, scaledSettings.scale);

        if (scaledSettings.effects.mirror) {
          ctx.save();
          ctx.translate(0, -height / 2);
          renderSpectrum(mode, ctx, dataArray, width / 2, height, scaledSettings, currentTimestamp);
          ctx.restore();
          ctx.save();
          ctx.scale(-1, 1);
          ctx.translate(0, -height / 2);
          renderSpectrum(mode, ctx, dataArray, width / 2, height, scaledSettings, currentTimestamp);
          ctx.restore();
        } else {
          ctx.translate(-width / 2, -height / 2);
          renderSpectrum(mode, ctx, dataArray, width, height, scaledSettings, currentTimestamp);
        }
        ctx.restore();

        // Draw Logo
        if (
          logoImageRef.current &&
          logoImageRef.current.complete &&
          logoImageRef.current.naturalWidth > 0
        ) {
          const img = logoImageRef.current;
          const logoScale = currentSettings.logoScale || 1.0;
          const baseSize = Math.min(width, height) * 0.15;
          const drawWidth = baseSize * logoScale;
          const aspectRatio = img.width / img.height;
          const drawHeight = drawWidth / aspectRatio;
          const x = (width - drawWidth) * ((currentSettings.logoX ?? 95) / 100);
          const y =
            (height - drawHeight) * ((currentSettings.logoY ?? 5) / 100);
          ctx.globalAlpha = 0.9;
          ctx.drawImage(img, x, y, drawWidth, drawHeight);
          ctx.globalAlpha = 1.0;
        }

        // Draw Sticker/GIF
        let stickerSource: CanvasImageSource | null = null;
        let sAspectRatio = 1.0;
        let sWidth = 0;
        let sHeight = 0;
        if (gifControllerRef.current.isLoaded) {
          const frame = gifControllerRef.current.getFrame(
            animationTimeRef.current,
          );
          if (frame) {
            stickerSource = frame;
            sWidth =
              frame instanceof HTMLVideoElement
                ? frame.videoWidth
                : frame.width;
            sHeight =
              frame instanceof HTMLVideoElement
                ? frame.videoHeight
                : frame.height;
            sAspectRatio = sWidth / sHeight;
          }
        } else if (
          stickerImageRef.current &&
          stickerImageRef.current.complete &&
          stickerImageRef.current.naturalWidth > 0
        ) {
          stickerSource = stickerImageRef.current;
          sWidth = stickerImageRef.current.width;
          sHeight = stickerImageRef.current.height;
          sAspectRatio = sWidth / sHeight;
        }

        if (stickerSource) {
          const stickerScale = currentSettings.stickerScale || 1.0;
          const baseSize = Math.min(width, height) * 0.15;
          const drawWidth = baseSize * stickerScale;
          const drawHeight = drawWidth / sAspectRatio;
          const x =
            (width - drawWidth) * ((currentSettings.stickerX ?? 50) / 100);
          const y =
            (height - drawHeight) * ((currentSettings.stickerY ?? 50) / 100);
          ctx.drawImage(stickerSource, x, y, drawWidth, drawHeight);
        }

        effectRendererRef.current.draw(ctx, currentSettings.effects);

        if (currentSettings.effects.glitch && isBeat) {
          const glStr = currentSettings.effectParams.glitchStrength || 1.0;
          const sliceHeight = Math.random() * 50 + 10;
          const sliceY = Math.random() * height;
          const offset = (Math.random() - 0.5) * 40 * glStr;
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
        animationRef.current = requestAnimationFrame(render);
      };

      animationRef.current = requestAnimationFrame(render);
      return () => {
        if (animationRef.current) cancelAnimationFrame(animationRef.current);
      };
    }, [mode, isPlaying]);

    const getAspectRatio = () => {
      switch (settings.resolution) {
        case "1080p_vertical":
        case "720p_vertical":
          return "9/16";
        case "1080p_square":
          return "1/1";
        default:
          return "16/9";
      }
    };

    const isVerticalOrSquare = settings.resolution?.includes('vertical') || settings.resolution?.includes('square');

    return (
      <div
        ref={containerRef}
        className="w-full h-full bg-app-bg flex items-center justify-center p-6 overflow-hidden"
      >
        {/* Soft UI Frame */}
        <div 
          className="relative rounded-3xl overflow-hidden shadow-neu-pressed p-2 bg-app-bg transition-all duration-300 flex-shrink-0"
          style={{ 
            aspectRatio: getAspectRatio(),
            width: isVerticalOrSquare ? 'auto' : '100%',
            height: isVerticalOrSquare ? '100%' : 'auto',
            maxHeight: '100%',
            maxWidth: '100%'
          }}
        >
          <div className="w-full h-full rounded-2xl overflow-hidden bg-black shadow-inner">
            <canvas ref={internalCanvasRef} className="w-full h-full block object-contain" />
          </div>

          {/* Minimal Overlay */}
          {mode && (
            <div className="absolute top-6 right-6 pointer-events-none z-10 opacity-60">
              <span className="text-[10px] text-white font-mono tracking-widest uppercase shadow-black drop-shadow-md bg-black/40 px-2 py-1 rounded">
                {mode}
              </span>
            </div>
          )}
        </div>
      </div>
    );
  },
);

export default Visualizer;
