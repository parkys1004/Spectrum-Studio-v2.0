import { VisualizerSettings } from "../../types";
import { createRainbowGradient, fillRoundedRect } from "./helpers";

export const drawDualBars = (
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  data: Uint8Array,
  bufferLength: number,
  width: number,
  height: number,
  settings: VisualizerSettings,
  timestamp: number = 0,
) => {
  const centerY = height / 2;
  const gap = settings.lineThickness;
  const meaningfulBufferLength = Math.floor(bufferLength * 0.5);
  const barWidth = Math.max(2, (width / meaningfulBufferLength) * 2 - gap);
  const isRainbow = settings.color === "rainbow";
  const baseRadius = settings.roundness ?? 0;

  let x = 0;

  if (!isRainbow) ctx.fillStyle = settings.color;

  for (let i = 0; i < meaningfulBufferLength; i++) {
    const val = data[i];
    const barHeight = (val / 255) * (height / 2) * settings.amplitude;

    if (isRainbow) {
      const hue = (i / meaningfulBufferLength) * 360;
      ctx.fillStyle = `hsl(${hue}, 100%, 50%)`;
    }

    // Draw Top
    fillRoundedRect(
      ctx,
      x,
      centerY - barHeight,
      barWidth,
      barHeight,
      baseRadius,
    );
    // Draw Bottom
    fillRoundedRect(ctx, x, centerY, barWidth, barHeight, baseRadius);

    x += barWidth + gap;
  }
};

export const drawRoundedBars = (
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  data: Uint8Array,
  bufferLength: number,
  width: number,
  height: number,
  settings: VisualizerSettings,
  timestamp: number = 0,
) => {
  // Map lineThickness (1-100) to Bar Count (Fewer bars = Thicker lines)
  // Range: 120 bars (Thin) to 10 bars (Thick)
  const t = Math.max(1, Math.min(100, settings.lineThickness));
  const maxBars = 120;
  const minBars = 10;
  // As thickness goes up, bar count goes down
  const barCount = Math.floor(maxBars - ((t - 1) / 99) * (maxBars - minBars));

  // Calculate layout
  const gapRatio = 0.15; // 15% of space is gaps
  const totalGapWidth = width * gapRatio;
  const singleGap = totalGapWidth / (barCount - 1);
  const barWidth = (width - totalGapWidth) / barCount;

  // Focus on lower 70% of frequency spectrum (where most music action is)
  const meaningfulLength = Math.floor(bufferLength * 0.7);
  const step = Math.floor(meaningfulLength / barCount);

  let x = 0;
  const isRainbow = settings.color === "rainbow";

  for (let i = 0; i < barCount; i++) {
    // Average the frequency data for this chunk
    let sum = 0;
    let count = 0;
    const startIdx = i * step;
    for (let j = 0; j < step; j++) {
      if (startIdx + j < data.length) {
        sum += data[startIdx + j];
        count++;
      }
    }
    const val = count > 0 ? sum / count : 0;

    // Ensure minimum height matches width for a perfect circle when silent
    const minHeight = barWidth;
    const calculatedHeight = (val / 255) * height * settings.amplitude;
    const barHeight = Math.max(minHeight, calculatedHeight);

    if (isRainbow) {
      const hue = (i / barCount) * 360;
      ctx.fillStyle = `hsl(${hue}, 100%, 60%)`;
    } else {
      ctx.fillStyle = settings.color;
    }

    // Draw Pill Shape (Radius = Half Width forces full round ends)
    fillRoundedRect(
      ctx,
      x,
      height - barHeight,
      barWidth,
      barHeight,
      barWidth / 2,
    );

    x += barWidth + singleGap;
  }
};

export const drawLedBars = (
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  data: Uint8Array,
  bufferLength: number,
  width: number,
  height: number,
  settings: VisualizerSettings,
  timestamp: number = 0,
) => {
  const meaningfulLength = Math.floor(bufferLength * 0.7);
  const gapX = 4;
  const barWidth = Math.max(4, width / meaningfulLength - gapX);
  const segmentHeight = 6;
  const gapY = 2;
  const baseRadius = settings.roundness ?? 2; // Default to 2 if not set

  let x = (width - meaningfulLength * (barWidth + gapX)) / 2;
  if (x < 0) x = 0;

  for (let i = 0; i < meaningfulLength; i++) {
    if (x > width) break;

    const val = data[i];

    // Gradient Color (Purple -> Red -> Yellow -> Green -> Blue)
    const hue = 320 - (i / meaningfulLength) * 280;
    ctx.fillStyle = `hsl(${hue}, 100%, 55%)`;
    ctx.shadowBlur = 10;
    ctx.shadowColor = `hsl(${hue}, 100%, 55%)`;

    const barHeight = (val / 255) * height * settings.amplitude * 0.8;
    const numSegments = Math.floor(barHeight / (segmentHeight + gapY));

    for (let j = 0; j < numSegments; j++) {
      const y = height - j * (segmentHeight + gapY) - 10; // padding bottom
      fillRoundedRect(
        ctx,
        x,
        y - segmentHeight,
        barWidth,
        segmentHeight,
        baseRadius,
      );
    }

    x += barWidth + gapX;
  }
  ctx.shadowBlur = 0;
};

export const drawMonstercat = (
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  data: Uint8Array,
  bufferLength: number,
  width: number,
  height: number,
  settings: VisualizerSettings,
  timestamp: number = 0,
) => {
  const barCount = 64;
  const gap = Math.min(settings.lineThickness, width / barCount - 2);
  const barWidth = Math.max(2, width / barCount - gap);
  const step = Math.floor((bufferLength * 0.6) / barCount);
  const isRainbow = settings.color === "rainbow";

  let x = gap / 2;

  for (let i = 0; i < barCount; i++) {
    let sum = 0;
    for (let j = 0; j < step; j++) {
      sum += data[i * step + j];
    }
    const val = sum / step;
    const barHeight = Math.max(4, (val / 255) * height * settings.amplitude);

    if (isRainbow) {
      const hue = (i / barCount) * 360;
      ctx.fillStyle = `hsl(${hue}, 100%, 60%)`;
    } else {
      ctx.fillStyle = settings.color;
    }

    ctx.shadowBlur = 10;
    ctx.shadowColor = ctx.fillStyle as string;

    ctx.fillRect(x, height - barHeight, barWidth, barHeight);

    x += barWidth + gap;
  }
  ctx.shadowBlur = 0;
};

