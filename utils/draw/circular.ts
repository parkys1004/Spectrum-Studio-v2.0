import { VisualizerSettings } from "../../types";
import { createRainbowGradient, fillRoundedRect } from "./helpers";

export const drawCircle = (
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  data: Uint8Array,
  bufferLength: number,
  width: number,
  height: number,
  settings: VisualizerSettings,
  timestamp: number = 0,
) => {
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.min(width, height) / 4;
  const isRainbow = settings.color === "rainbow";

  ctx.beginPath();
  ctx.arc(centerX, centerY, radius - 10, 0, 2 * Math.PI);
  ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
  ctx.lineWidth = 1;
  ctx.stroke();

  const barsToDraw = 180;
  const step = Math.floor(bufferLength / barsToDraw);

  ctx.lineWidth = settings.lineThickness;
  ctx.lineCap = "round";

  if (!isRainbow) {
    ctx.strokeStyle = settings.color;
    ctx.shadowBlur = settings.lineThickness;
    ctx.shadowColor = settings.color;
  } else {
    ctx.shadowBlur = 0;
  }

  for (let i = 0; i < barsToDraw; i++) {
    const value = data[i * step] || 0;
    const scaledValue = (value / 255) * radius * settings.amplitude;

    const rad = Math.PI * 2 * (i / barsToDraw) - Math.PI / 2;
    const rOuter = radius + Math.max(5, scaledValue);

    if (isRainbow) {
      const hue = (i / barsToDraw) * 360;
      ctx.strokeStyle = `hsl(${hue}, 100%, 50%)`;
      ctx.shadowColor = `hsl(${hue}, 100%, 50%)`;
      ctx.shadowBlur = settings.lineThickness;
    }

    ctx.beginPath();
    ctx.moveTo(
      centerX + Math.cos(rad) * radius,
      centerY + Math.sin(rad) * radius,
    );
    ctx.lineTo(
      centerX + Math.cos(rad) * rOuter,
      centerY + Math.sin(rad) * rOuter,
    );
    ctx.stroke();
  }
  ctx.shadowBlur = 0;
};

export const drawRipple = (
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  data: Uint8Array,
  bufferLength: number,
  width: number,
  height: number,
  settings: VisualizerSettings,
  timestamp: number = 0,
) => {
  const centerX = width / 2;
  const centerY = height / 2;
  const maxRadius = Math.max(width, height) / 2;
  const isRainbow = settings.color === "rainbow";

  ctx.lineWidth = settings.lineThickness;
  if (!isRainbow) ctx.strokeStyle = settings.color;

  // Draw 10-20 concentric circles based on frequency bands
  const bands = 20;
  const step = Math.floor(bufferLength / bands);

  for (let i = 0; i < bands; i++) {
    const val = data[i * step];
    const scale = (val / 255) * settings.amplitude;

    if (scale > 0.1) {
      const r = (i / bands) * maxRadius;
      // Modulate opacity and thickness by amplitude
      ctx.globalAlpha = Math.min(1, scale);
      ctx.lineWidth = settings.lineThickness * scale * 3;

      if (isRainbow) {
        const hue = (i / bands) * 360;
        ctx.strokeStyle = `hsl(${hue}, 100%, 60%)`;
      }

      ctx.beginPath();
      ctx.arc(centerX, centerY, r, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
  ctx.globalAlpha = 1.0;
};

export const drawStarburst = (
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  data: Uint8Array,
  bufferLength: number,
  width: number,
  height: number,
  settings: VisualizerSettings,
  timestamp: number = 0,
) => {
  const centerX = width / 2;
  const centerY = height / 2;
  const maxRadius = Math.min(width, height) / 2;
  const isRainbow = settings.color === "rainbow";

  const lines = 64; // Fixed number of rays
  const step = Math.floor(bufferLength / lines);

  ctx.lineWidth = settings.lineThickness;
  ctx.lineCap = "round";

  for (let i = 0; i < lines; i++) {
    const val = data[i * step];
    const amp = (val / 255) * settings.amplitude;

    if (amp > 0.05) {
      const angle = (Math.PI * 2 * i) / lines;
      const len = amp * maxRadius;

      const xStart = centerX + Math.cos(angle) * 20; // Inner offset
      const yStart = centerY + Math.sin(angle) * 20;

      const xEnd = centerX + Math.cos(angle) * (20 + len);
      const yEnd = centerY + Math.sin(angle) * (20 + len);

      if (isRainbow) {
        const hue = (i / lines) * 360;
        ctx.strokeStyle = `hsl(${hue}, 100%, 60%)`;
        ctx.shadowColor = `hsl(${hue}, 100%, 60%)`;
      } else {
        ctx.strokeStyle = settings.color;
        ctx.shadowColor = settings.color;
      }

      ctx.shadowBlur = amp * 10;

      ctx.beginPath();
      ctx.moveTo(xStart, yStart);
      ctx.lineTo(xEnd, yEnd);
      ctx.stroke();

      // Draw tip dot
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.arc(xEnd, yEnd, settings.lineThickness, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.shadowBlur = 0;
};

export const drawButterfly = (
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  data: Uint8Array,
  bufferLength: number,
  width: number,
  height: number,
  settings: VisualizerSettings,
  timestamp: number = 0,
) => {
  const centerX = width / 2;
  const centerY = height / 2;
  const scale = Math.min(width, height) / 3;
  const isRainbow = settings.color === "rainbow";

  if (isRainbow) {
    // For butterfly, single stroke is hard to rainbow-ize without gradient
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, "red");
    gradient.addColorStop(0.2, "orange");
    gradient.addColorStop(0.4, "yellow");
    gradient.addColorStop(0.6, "green");
    gradient.addColorStop(0.8, "blue");
    gradient.addColorStop(1, "violet");
    ctx.strokeStyle = gradient;
    ctx.shadowColor = "rgba(255,255,255,0.5)";
  } else {
    ctx.strokeStyle = settings.color;
    ctx.shadowColor = settings.color;
  }

  ctx.lineWidth = settings.lineThickness;
  ctx.shadowBlur = 5;

  ctx.beginPath();
  const points = 100;
  const step = Math.floor(bufferLength / points);

  // Draw right wing
  for (let i = 0; i <= points; i++) {
    const val = data[i * step];
    const r = (0.5 + (val / 255) * settings.amplitude) * scale;
    const theta = (i / points) * Math.PI; // 0 to PI

    // Butterfly parametric-ish modification
    const x = centerX + r * Math.sin(theta) * Math.cos(theta * 2);
    const y = centerY - r * Math.cos(theta); // Upward orientation

    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();

  // Draw left wing (mirrored X)
  ctx.beginPath();
  for (let i = 0; i <= points; i++) {
    const val = data[i * step];
    const r = (0.5 + (val / 255) * settings.amplitude) * scale;
    const theta = (i / points) * Math.PI;

    const x = centerX - r * Math.sin(theta) * Math.cos(theta * 2); // Negative X offset
    const y = centerY - r * Math.cos(theta);

    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
  ctx.shadowBlur = 0;
};

export const drawPulseCircles = (
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  data: Uint8Array,
  bufferLength: number,
  width: number,
  height: number,
  settings: VisualizerSettings,
  timestamp: number = 0,
) => {
  const centerX = width / 2;
  const centerY = height / 2;

  // Calculate Bass Energy for the main pulse
  let bass = 0;
  for (let i = 0; i < 10; i++) bass += data[i];
  bass = bass / 10; // 0-255

  const normBass = bass / 255;
  const scale = settings.amplitude;
  const isRainbow = settings.color === "rainbow";

  // Base radius roughly matches the potential logo size (approx 15% of screen)
  // We add a bit of padding so it surrounds the logo
  const baseRadius = Math.min(width, height) * 0.18;

  const circles = 4;

  ctx.lineWidth = settings.lineThickness;

  for (let i = 0; i < circles; i++) {
    // Echo effect: Outer circles expand more but with delay simulation
    const offset = i * 25; // Gap between rings
    const expansion = normBass * (height * 0.15) * scale; // Expansion amount

    // Inner circle moves instantly, outer circles lag slightly in visual magnitude
    const r = baseRadius + offset + expansion * (1 + i * 0.3);

    ctx.beginPath();
    ctx.arc(centerX, centerY, r, 0, Math.PI * 2);

    // Opacity fades for outer rings
    // Dynamic opacity based on beat
    const beatAlpha = 0.5 + normBass * 0.5;
    const layerAlpha = Math.max(0, 1 - i / circles);
    const alpha = beatAlpha * layerAlpha;

    if (isRainbow) {
      const hue = (i / circles) * 360; // Just gradient rings
      const beatHue = (timestamp / 10) % 360; // Rotating colors
      ctx.strokeStyle = `hsl(${beatHue + i * 30}, 100%, 60%)`;
    } else {
      ctx.strokeStyle = settings.color;
    }

    // Dynamic width: Loud = Thicker
    ctx.lineWidth = settings.lineThickness * (1 + normBass * (1 - i / circles));

    ctx.globalAlpha = alpha;
    ctx.stroke();
    ctx.closePath();
  }
  ctx.globalAlpha = 1.0;
};

export const drawFlowerPetals = (
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  data: Uint8Array,
  bufferLength: number,
  width: number,
  height: number,
  settings: VisualizerSettings,
  timestamp: number = 0,
) => {
  const centerX = width / 2;
  const centerY = height / 2;
  const maxRadius = Math.min(width, height) / 2.5;
  const time = timestamp / 2000; // Slow rotation

  const isRainbow = settings.color === "rainbow";

  // Number of petals - fewer for a defined flower look
  const numPetals = 24;
  const step = Math.floor(bufferLength / numPetals);

  // Calculate Bass for Center Pulse
  let bass = 0;
  for (let i = 0; i < 10; i++) bass += data[i];
  bass = bass / 10;
  const normBass = bass / 255;

  // Rotate the whole flower slowly
  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.rotate(time);

  // Draw Petals
  for (let i = 0; i < numPetals; i++) {
    // Get frequency data for this petal
    // Average a small chunk for stability
    let val = 0;
    for (let k = 0; k < step; k++) val += data[i * step + k] || 0;
    val /= step;

    const amp = (val / 255) * settings.amplitude;

    // Skip tiny petals
    if (amp < 0.05) continue;

    const angle = (Math.PI * 2 * i) / numPetals;
    const petalLen = maxRadius * amp;
    const petalWidth = ((Math.PI * 2 * maxRadius) / numPetals) * 0.6; // Width at widest point

    // Base Radius (Pistil size)
    const rBase = 30 + normBass * 20;

    // Tip Coordinate
    const tipX = Math.cos(angle) * (rBase + petalLen);
    const tipY = Math.sin(angle) * (rBase + petalLen);

    // Base Coordinates (slightly offset for width)
    // We actually want a bezier curve: Base -> Control Point 1 -> Tip -> Control Point 2 -> Base

    // Calculate control points for "fat" petals
    const cpAngleLeft = angle - ((Math.PI * 2) / numPetals) * 0.5;
    const cpAngleRight = angle + ((Math.PI * 2) / numPetals) * 0.5;

    const cpDist = rBase + petalLen * 0.5;

    const cp1x = Math.cos(cpAngleLeft) * cpDist;
    const cp1y = Math.sin(cpAngleLeft) * cpDist;

    const cp2x = Math.cos(cpAngleRight) * cpDist;
    const cp2y = Math.sin(cpAngleRight) * cpDist;

    const baseX = Math.cos(angle) * rBase;
    const baseY = Math.sin(angle) * rBase;

    ctx.beginPath();
    ctx.moveTo(baseX, baseY);
    // Left curve
    ctx.quadraticCurveTo(cp1x, cp1y, tipX, tipY);
    // Right curve
    ctx.quadraticCurveTo(cp2x, cp2y, baseX, baseY);

    // Color
    if (isRainbow) {
      const hue = (i / numPetals) * 360;
      ctx.fillStyle = `hsla(${hue}, 100%, 60%, 0.8)`;
      ctx.strokeStyle = `hsl(${hue}, 100%, 80%)`;
    } else {
      ctx.fillStyle = settings.color;
      ctx.globalAlpha = 0.8;
      ctx.strokeStyle = "rgba(255,255,255,0.4)";
    }

    ctx.fill();
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.globalAlpha = 1.0;
  }

  // Draw Center (Pistil)
  ctx.beginPath();
  const centerRadius = 25 + normBass * 15;
  ctx.arc(0, 0, centerRadius, 0, Math.PI * 2);

  if (isRainbow) {
    ctx.fillStyle = "#fff";
  } else {
    ctx.fillStyle = "#fff"; // White center usually looks best or yellow
  }
  ctx.shadowBlur = 20;
  ctx.shadowColor = "white";
  ctx.fill();

  // Stamen dots
  ctx.fillStyle = "#333";
  ctx.shadowBlur = 0;
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 + time * 2;
    const r = centerRadius * 0.5;
    ctx.beginPath();
    ctx.arc(Math.cos(a) * r, Math.sin(a) * r, 2, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
};

