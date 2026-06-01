import { VisualizerSettings } from "../../types";
import { createRainbowGradient, fillRoundedRect } from "./helpers";

export const drawPixel = (
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  data: Uint8Array,
  bufferLength: number,
  width: number,
  height: number,
  settings: VisualizerSettings,
  timestamp: number = 0,
) => {
  const gap = 2;
  const blockSize = settings.lineThickness * 4; // Larger blocks
  const cols = Math.floor(width / (blockSize + gap));
  const step = Math.floor(bufferLength / cols);
  const isRainbow = settings.color === "rainbow";

  if (!isRainbow) ctx.fillStyle = settings.color;

  for (let i = 0; i < cols; i++) {
    const val = data[i * step];
    const barHeight = (val / 255) * height * settings.amplitude;
    const numBlocks = Math.floor(barHeight / (blockSize + gap));

    const x = i * (blockSize + gap);

    if (isRainbow) {
      const hue = (i / cols) * 360;
      ctx.fillStyle = `hsl(${hue}, 100%, 60%)`;
    }

    for (let j = 0; j < numBlocks; j++) {
      const y = height - j * (blockSize + gap) - blockSize;

      // Variate opacity for retro fade effect
      ctx.globalAlpha = 0.5 + (j / numBlocks) * 0.5;
      ctx.fillRect(x, y, blockSize, blockSize);
    }
  }
  ctx.globalAlpha = 1.0;
};

export const drawSpectrum = (
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  data: Uint8Array,
  bufferLength: number,
  width: number,
  height: number,
  settings: VisualizerSettings,
  timestamp: number = 0,
) => {
  const centerY = height / 2;
  const meaningfulBufferLength = Math.floor(bufferLength * 0.7); // Drop high freq silence

  // Determine bar size
  const gapX = 4;
  // Calculate optimal bar width to fill screen
  const availableWidth = width;
  // Calculate how many bars we can fit with minimum width
  const minBarWidth = 6;
  let barWidth = Math.max(
    minBarWidth,
    availableWidth / meaningfulBufferLength - gapX,
  );

  // Recalculate how many items to skip if bars are too dense
  const itemsToDraw = Math.floor(availableWidth / (barWidth + gapX));
  const step = Math.ceil(meaningfulBufferLength / itemsToDraw);

  const dotSize = barWidth;
  const gapY = 3;

  let x = (width - itemsToDraw * (barWidth + gapX)) / 2; // Center horizontally

  // Pre-set shadow to avoid context switching cost inside loop if possible,
  // but color changes per bar so we must set it.
  ctx.shadowBlur = 8;

  for (let i = 0; i < meaningfulBufferLength; i += step) {
    if (x > width) break;

    const val = data[i];
    if (val < 5) {
      x += barWidth + gapX;
      continue;
    }

    const amplitude = (val / 255) * (height / 2.2) * settings.amplitude;

    // Color mapping: Pink(340) -> Blue -> Green -> Yellow(40)
    // Map i (0 to meaningfulBufferLength) to Hue (340 to 40)
    const percent = i / meaningfulBufferLength;
    const hue = Math.floor(340 - percent * 300); // Use integer for slightly faster string concat

    const color = `hsl(${hue}, 100%, 60%)`;
    ctx.fillStyle = color;
    ctx.shadowColor = color; // Reuse calculated color

    const numDots = Math.floor(amplitude / (dotSize + gapY));

    // Draw Dots Center-Out
    for (let j = 0; j < numDots; j++) {
      const yOffset = j * (dotSize + gapY);

      // Top
      ctx.beginPath();
      ctx.arc(
        x + dotSize / 2,
        centerY - yOffset - dotSize / 2,
        dotSize / 2,
        0,
        Math.PI * 2,
      );
      ctx.fill();

      // Bottom (Mirror)
      ctx.beginPath();
      ctx.arc(
        x + dotSize / 2,
        centerY + yOffset + dotSize / 2,
        dotSize / 2,
        0,
        Math.PI * 2,
      );
      ctx.fill();
    }

    x += barWidth + gapX;
  }
  ctx.shadowBlur = 0;
};

export const drawDotWave = (
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  data: Uint8Array,
  bufferLength: number,
  width: number,
  height: number,
  settings: VisualizerSettings,
  timestamp: number = 0,
) => {
  const centerY = height / 2;
  const meaningfulLength = Math.floor(bufferLength * 0.75);
  const gapX = 4;
  const dotSize = Math.max(2, width / meaningfulLength - gapX);
  const gapY = 4;

  let x = (width - meaningfulLength * (dotSize + gapX)) / 2;
  if (x < 0) x = 0;

  for (let i = 0; i < meaningfulLength; i++) {
    const val = data[i];
    if (x > width) break;

    // Rainbow gradient x-axis
    const hue = (i / meaningfulLength) * 360;
    ctx.fillStyle = `hsl(${hue}, 100%, 60%)`;

    if (val > 10) {
      const amplitude = (val / 255) * height * settings.amplitude * 0.8;
      const numDots = Math.floor(amplitude / (dotSize + gapY));

      // Draw center dot
      ctx.beginPath();
      ctx.arc(x + dotSize / 2, centerY, dotSize / 2, 0, Math.PI * 2);
      ctx.fill();

      // Draw vertically expanding dots
      for (let j = 1; j <= numDots / 2; j++) {
        const offset = j * (dotSize + gapY);

        // Up
        ctx.beginPath();
        ctx.arc(x + dotSize / 2, centerY - offset, dotSize / 2, 0, Math.PI * 2);
        ctx.fill();

        // Down
        ctx.beginPath();
        ctx.arc(x + dotSize / 2, centerY + offset, dotSize / 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    x += dotSize + gapX;
  }
};

export const drawParticleSpectrum = (
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  data: Uint8Array,
  bufferLength: number,
  width: number,
  height: number,
  settings: VisualizerSettings,
  timestamp: number = 0,
) => {
  const meaningfulLength = Math.floor(bufferLength * 0.7);
  const numParticles = 150; // High count for "dust" effect
  const time = timestamp / 1000;

  // Cute Pastel Palette
  const colors = [
    "#FF9AA2",
    "#FFB7B2",
    "#FFDAC1",
    "#E2F0CB",
    "#B5EAD7",
    "#C7CEEA",
    "#FFF5BA",
    "#FF99CC",
    "#99CCFF",
  ];

  for (let i = 0; i < numParticles; i++) {
    // Map to frequency data
    // Distribute particles across frequency range
    const dataIndex = Math.floor((i / numParticles) * meaningfulLength);
    const val = data[dataIndex] || 0;
    const normalizedVal = val / 255;
    const amp = normalizedVal * settings.amplitude;

    // Base Visibility threshold
    if (amp < 0.05) continue;

    // Position Logic
    // X: Base position + Sine wave drift
    const seed = i * 123.456; // Pseudo-random seed based on index
    const xBase = (i / numParticles) * width;
    const driftX = Math.sin(time + seed) * 30;
    let x = xBase + driftX;

    // Wrap X
    if (x < 0) x += width;
    if (x > width) x -= width;

    // Y: Float Upwards + Beat Lift
    const speed = 20 + (i % 10) * 10;
    const yBase = (time * speed + seed * 100) % (height + 100);
    let y = height + 50 - yBase;

    // Beat interaction: Loud sounds push particles up momentarily
    y -= Math.pow(amp, 2) * 100;

    // Appearance
    const size = 2 + (i % 4) * 2 + amp * 10; // Base size + Audio reaction
    const color = colors[i % colors.length];

    ctx.globalAlpha = 0.4 + amp * 0.6; // Beat controls opacity

    // Draw Particle
    ctx.beginPath();
    // Shape variation: mostly circles, some stars or diamonds could be cute but circle is safest "cute" shape
    ctx.arc(x, y, size, 0, Math.PI * 2);

    ctx.fillStyle = color;
    ctx.fill();

    // Optional: Cute "Glow" or "Halo" for loud particles
    if (amp > 0.6) {
      ctx.lineWidth = 2;
      ctx.strokeStyle = "rgba(255,255,255,0.5)";
      ctx.stroke();
    }

    // Decor: Small white dot for shine
    ctx.fillStyle = "rgba(255,255,255,0.8)";
    ctx.beginPath();
    ctx.arc(x - size * 0.3, y - size * 0.3, size * 0.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalAlpha = 1.0;
  }
};

