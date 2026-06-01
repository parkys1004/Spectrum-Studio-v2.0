import { VisualizerSettings } from "../../types";
import { createRainbowGradient, fillRoundedRect } from "./helpers";

export const drawSymmetricWave = (
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  data: Uint8Array,
  bufferLength: number,
  width: number,
  height: number,
  settings: VisualizerSettings,
  timestamp: number = 0,
) => {
  const centerY = height / 2;
  const meaningfulLength = Math.floor(bufferLength * 0.7);
  const sliceWidth = width / meaningfulLength;
  const isRainbow = settings.color === "rainbow";

  const drawHalf = (flip: boolean) => {
    ctx.beginPath();
    ctx.moveTo(0, centerY);

    let x = 0;
    let prevX = 0;
    let prevY = centerY;

    for (let i = 0; i < meaningfulLength; i++) {
      const val = data[i];
      const amp = (val / 255) * (height / 2) * settings.amplitude;
      const y = flip ? centerY + amp : centerY - amp;

      if (i === 0) {
        ctx.lineTo(x, y);
      } else {
        const cx = (prevX + x) / 2;
        const cy = (prevY + y) / 2;
        ctx.quadraticCurveTo(prevX, prevY, cx, cy);
      }

      prevX = x;
      prevY = y;
      x += sliceWidth;
    }

    ctx.lineTo(width, centerY);
    ctx.closePath();

    if (isRainbow) {
      ctx.fillStyle = createRainbowGradient(ctx, width, height, true);
    } else {
      ctx.fillStyle = settings.color;
    }

    ctx.globalAlpha = 0.8;
    ctx.fill();
    ctx.globalAlpha = 1.0;
  };

  drawHalf(false);
  drawHalf(true);
};

export const drawFluid = (
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  data: Uint8Array,
  bufferLength: number,
  width: number,
  height: number,
  settings: VisualizerSettings,
  timestamp: number = 0,
) => {
  // Smoother stepping for fluid look
  const step = Math.ceil(bufferLength / 32);
  const sliceWidth = width / (bufferLength / step);
  const isRainbow = settings.color === "rainbow";

  let gradient: CanvasGradient;

  // Create Vibrant Gradient
  if (isRainbow) {
    gradient = createRainbowGradient(ctx, width, height, false); // Vertical
  } else {
    gradient = ctx.createLinearGradient(0, height * 0.2, 0, height);
    gradient.addColorStop(0, settings.color);
    gradient.addColorStop(0.3, "#33ccff"); // Cyan mid
    gradient.addColorStop(0.7, "#9933ff"); // Violet mid
    gradient.addColorStop(1, "#ff33aa"); // Pink end
  }

  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.moveTo(0, height);

  let x = 0;
  let prevX = 0;
  let prevY = height;

  for (let i = 0; i < bufferLength; i += step) {
    const val = data[i];
    // Logarithmic scaling for better "hills"
    const amp = Math.pow(val / 255.0, 1.5) * height * settings.amplitude;
    const y = height - amp;

    if (i === 0) {
      ctx.lineTo(x, y);
    } else {
      // Cubic Bezier for ultra smooth liquid look
      const cp1x = prevX + (x - prevX) / 2;
      const cp1y = prevY;
      const cp2x = prevX + (x - prevX) / 2;
      const cp2y = y;
      ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x, y);
    }

    prevX = x;
    prevY = y;
    x += sliceWidth;
  }

  ctx.lineTo(width, height);
  ctx.closePath();
  ctx.globalAlpha = 0.85;
  ctx.fill();
  ctx.globalAlpha = 1.0;

  // Top highlight line
  ctx.lineWidth = 3;
  ctx.strokeStyle = "rgba(255,255,255,0.6)";
  ctx.shadowBlur = 15;
  ctx.shadowColor = "#ffffff";
  ctx.stroke();
  ctx.shadowBlur = 0;
};

export const drawJellyWave = (
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  data: Uint8Array,
  bufferLength: number,
  width: number,
  height: number,
  settings: VisualizerSettings,
  timestamp: number = 0,
) => {
  const time = timestamp / 2000; // Slow time
  const centerY = height / 2;
  const isRainbow = settings.color === "rainbow";

  // Use a subset of data for smoother curve
  const step = Math.floor(bufferLength / 20);

  // Draw 3 layers for depth
  for (let layer = 0; layer < 3; layer++) {
    ctx.beginPath();

    const layerOffset = layer * 30; // Vertical separation
    const phaseOffset = layer * 2; // Different wiggle phase
    const colorAlpha = 0.3 + layer * 0.15;

    ctx.moveTo(0, height); // Start bottom left

    let firstPoint = true;
    let prevX = 0;
    let prevY = height;

    for (let i = 0; i <= bufferLength; i += step) {
      const x = (i / bufferLength) * width;

      // Audio data
      const val = data[i] || 0;
      // Soft dampening
      const audioAmp = (val / 255) * height * 0.4 * settings.amplitude;

      // Jelly Sine Wave
      // Add time-based sine wave for the "Jelly" wobble
      // Frequency varies slightly across width
      const jelly = Math.sin((i / bufferLength) * 4 + time + phaseOffset) * 40;
      const jelly2 = Math.cos((i / bufferLength) * 9 - time * 2) * 20;

      const y = height - (audioAmp + jelly + jelly2) - 100 + layerOffset;

      if (firstPoint) {
        ctx.lineTo(x, y);
        firstPoint = false;
      } else {
        const cx = (prevX + x) / 2;
        const cy = (prevY + y) / 2;
        ctx.quadraticCurveTo(prevX, prevY, cx, cy);
      }

      prevX = x;
      prevY = y;
    }

    ctx.lineTo(width, prevY);
    ctx.lineTo(width, height);
    ctx.closePath();

    if (isRainbow) {
      const gradient = createRainbowGradient(ctx, width, height, true);
      ctx.fillStyle = gradient;
    } else {
      ctx.fillStyle = settings.color;
    }

    ctx.globalAlpha = colorAlpha;
    ctx.fill();

    // Shiny top edge
    ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
    ctx.lineWidth = 2;
    ctx.stroke();
  }
  ctx.globalAlpha = 1.0;
};

export const drawAurora = (
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  data: Uint8Array,
  bufferLength: number,
  width: number,
  height: number,
  settings: VisualizerSettings,
  timestamp: number = 0,
) => {
  const centerY = height / 2;

  // Create Rainbow Gradient (Red -> Violet)
  const gradient = ctx.createLinearGradient(0, 0, width, 0);
  gradient.addColorStop(0.0, "#ff3333"); // Red
  gradient.addColorStop(0.16, "#ffaa33"); // Orange
  gradient.addColorStop(0.33, "#ffff33"); // Yellow
  gradient.addColorStop(0.5, "#33ff33"); // Green
  gradient.addColorStop(0.66, "#33ffff"); // Cyan
  gradient.addColorStop(0.83, "#3333ff"); // Blue
  gradient.addColorStop(1.0, "#aa33ff"); // Violet

  // Settings
  const smoothingStep = Math.max(1, Math.floor(bufferLength / 128)); // Reduce points for smoother curve

  // Function to draw one side (up or down)
  const drawSide = (flip: boolean, opacity: number) => {
    ctx.fillStyle = gradient;
    ctx.globalAlpha = opacity;

    ctx.beginPath();
    ctx.moveTo(0, centerY);

    let px = 0;
    let py = centerY;

    const sliceWidth = width / (bufferLength / smoothingStep);
    let x = 0;

    for (let i = 0; i < bufferLength; i += smoothingStep) {
      const val = data[i];
      // Amplitude scaling
      const barHeight = (val / 255) * (height / 2.5) * settings.amplitude;

      const targetX = x;
      const targetY = flip ? centerY + barHeight : centerY - barHeight;

      if (i === 0) {
        ctx.moveTo(targetX, targetY);
      } else {
        // Quadratic curve for smooth peaks
        const cx = (px + targetX) / 2;
        const cy = (py + targetY) / 2;
        ctx.quadraticCurveTo(px, py, cx, cy);
      }

      px = targetX;
      py = targetY;
      x += sliceWidth;
    }

    ctx.lineTo(width, centerY);
    ctx.closePath();
    ctx.fill();

    // Optional: White line on top for definition
    ctx.lineWidth = 1;
    ctx.strokeStyle = "rgba(255,255,255,0.3)";
    ctx.stroke();
  };

  // Draw Top
  drawSide(false, 0.9);

  // Draw Bottom (Reflection)
  drawSide(true, 0.4);

  ctx.globalAlpha = 1.0;
};

