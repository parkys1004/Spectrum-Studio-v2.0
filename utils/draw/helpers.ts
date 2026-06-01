import { VisualizerSettings } from "../../types";

export const createRainbowGradient = (
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  width: number,
  height: number,
  horizontal: boolean = true,
) => {
  const gradient = horizontal
    ? ctx.createLinearGradient(0, 0, width, 0)
    : ctx.createLinearGradient(0, height, 0, 0); // Bottom up

  gradient.addColorStop(0, "#ff0000");
  gradient.addColorStop(0.15, "#ff7f00");
  gradient.addColorStop(0.3, "#ffff00");
  gradient.addColorStop(0.45, "#00ff00");
  gradient.addColorStop(0.6, "#0000ff");
  gradient.addColorStop(0.75, "#4b0082");
  gradient.addColorStop(1, "#9400d3");
  return gradient;
};

// Helper: Robust Rounded Rect Fill (Supports Fallback)
export const fillRoundedRect = (
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) => {
  // Clamp radius to half of width/height to avoid artifacts
  const radius = Math.min(r, w / 2, h / 2);

  if (radius <= 0) {
    ctx.fillRect(x, y, w, h);
    return;
  }

  ctx.beginPath();
  if (ctx.roundRect) {
    // Modern API
    ctx.roundRect(x, y, w, h, radius);
  } else {
    // Fallback for older browsers
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + w - radius, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
    ctx.lineTo(x + w, y + h - radius);
    ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
    ctx.lineTo(x + radius, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }
  ctx.fill();
};
