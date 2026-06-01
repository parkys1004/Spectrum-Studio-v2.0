export interface Track {
  id: string;
  name: string;
  artist?: string;
  duration: number;
  url: string; // Object URL (ephemeral)
  file?: File | Blob; // Can be missing on reload until loaded from IDB
  mood?: "Chill" | "Upbeat" | "Powerful";
  moodColor?: string;
}

export interface VisualizerSettings {
  color: string;
  lineThickness: number; // 1 to 100
  roundness: number; // 0 to 50 (Border Radius)
  amplitude: number; // 0.5 to 3.0
  sensitivity: number; // 0.1 to 0.99 (smoothing)
  backgroundImage: string | null; // URL string
  logoImage: string | null; // URL string
  scale: number; // 0.1 to 5.0
  positionX: number; // -width/2 to width/2
  positionY: number; // -height/2 to height/2
  // Logo specific settings
  logoScale: number; // 0.1 to 10.0
  logoX: number; // 0 to 100 (%)
  logoY: number; // 0 to 100 (%)

  // Sticker / GIF Overlay specific settings
  stickerImage: string | null;
  stickerScale: number; // 0.1 to 10.0
  stickerX: number; // 0 to 100 (%)
  stickerY: number; // 0 to 100 (%)

  // Post-processing & Atmospheric Effects
  resolution: "1080p" | "720p" | "1080p_vertical" | "720p_vertical" | "1080p_square";
  effects: {
    // Transforms
    mirror: boolean; // Horizontal symmetry
    pulse: boolean; // Zoom on beat
    shake: boolean; // Screen shake on beat
    glitch: boolean; // RGB Shift / Slice glitch

    // Atmosphere (New)
    snow: boolean; // Falling snow
    rain: boolean; // Falling rain
    raindrops: boolean; // Water droplets on lens/window
    particles: boolean; // Floating bokeh/dust
    fireworks: boolean; // Explosions on beat
    starfield: boolean; // Twinkling stars
    fog: boolean; // Drifting smoke/fog
    fireflies: boolean; // New: Glowing drifting bugs

    // Overlays (New)
    filmGrain: boolean; // Retro noise
    vignette: boolean; // Dark corners
    scanlines: boolean; // CRT TV lines
  };

  // New: Fine-grained controls for effects
  effectParams: {
    speed: number; // 0.1 to 3.0 (Multiplier for movement)
    intensity: number; // 0.1 to 3.0 (Multiplier for count/density)
    shakeStrength: number; // 0.1 to 2.0 (Multiplier for shake distance)
    glitchStrength: number; // 0.1 to 2.0 (Multiplier for glitch severity)
  };
}

export enum VisualizerMode {
  CIRCULAR = "CIRCULAR", // Circular bars
  DUAL_BARS = "DUAL_BARS", // Bars growing up and down
  RIPPLE = "RIPPLE", // Concentric circles
  PIXEL = "PIXEL", // Retro blocky bars
  ROUNDED_BARS = "ROUNDED_BARS", // Modern rounded bars (Replaces Equalizer)
  STARBURST = "STARBURST", // Radial lines from center
  BUTTERFLY = "BUTTERFLY", // Mirrored wing shape
  AURORA = "AURORA", // Rainbow Gradient Wave
  SPECTRUM = "SPECTRUM", // Center-out Dot Spectrum (Multi-color)
  DOT_WAVE = "DOT_WAVE", // Horizontal wave of dots
  LED_BARS = "LED_BARS", // Rainbow Segmented Bars
  FLUID = "FLUID", // Gradient Fluid
  PARTICLES = "PARTICLES", // Particle Spectrum
  JELLY_WAVE = "JELLY_WAVE", // Soft/Jelly like smooth wave
  PULSE_CIRCLES = "PULSE_CIRCLES", // Heartbeat-like expanding circles
  FLOWER_PETALS = "FLOWER_PETALS", // Flower blooming effect
  SYMMETRIC_WAVE = "SYMMETRIC_WAVE", // Symmetric glowing wave
  MONSTERCAT = "MONSTERCAT", // Clean bars with gap
}
