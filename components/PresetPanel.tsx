import React from "react";
import { VisualizerMode, VisualizerSettings } from "../types";
import { SpectrumButton } from "./presets/SpectrumButton";
import { EffectButton } from "./presets/EffectButton";

interface PresetPanelProps {
  currentMode: VisualizerMode | null;
  onModeChange: (mode: VisualizerMode | null) => void;
  settings: VisualizerSettings;
  onSettingsChange: (newSettings: VisualizerSettings) => void;
}

const PresetPanel: React.FC<PresetPanelProps> = ({
  currentMode,
  onModeChange,
  settings,
  onSettingsChange,
}) => {
  const toggleEffect = (key: keyof VisualizerSettings["effects"]) => {
    onSettingsChange({
      ...settings,
      effects: {
        ...settings.effects,
        [key]: !settings.effects[key],
      },
    });
  };

  return (
    <div className="flex flex-col h-full bg-app-bg overflow-y-auto p-1">
      {/* 1. Spectrum Types */}
      <div className="p-4">
        <div className="flex items-center mb-4">
          <span className="text-xs font-bold text-app-textMuted uppercase tracking-widest pl-1">
            시각화 (MODES)
          </span>
        </div>

        {/* Fixed grid to 3 columns */}
        <div className="grid grid-cols-3 gap-4">
          <SpectrumButton currentMode={currentMode} onModeChange={onModeChange}
            mode={VisualizerMode.MONSTERCAT}
            label="MONSTERCAT"
            icon={
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <rect x="3" y="14" width="4" height="6" />
                <rect x="10" y="8" width="4" height="12" />
                <rect x="17" y="12" width="4" height="8" />
              </svg>
            }
          />
          <SpectrumButton currentMode={currentMode} onModeChange={onModeChange}
            mode={VisualizerMode.SYMMETRIC_WAVE}
            label="SYM WAVE"
            icon={
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M2 12 Q 8 6, 12 12 T 22 12" strokeLinecap="round" />
                <path d="M2 12 Q 8 18, 12 12 T 22 12" strokeLinecap="round" />
              </svg>
            }
          />
          <SpectrumButton currentMode={currentMode} onModeChange={onModeChange}
            mode={VisualizerMode.FLOWER_PETALS}
            label="FLOWER"
            icon={
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="3" />
                <path d="M12 2 C 14 2, 15 5, 15 8 C 15 10, 14 11, 12 11 C 10 11, 9 10, 9 8 C 9 5, 10 2, 12 2 Z" />
                <path d="M12 22 C 10 22, 9 19, 9 16 C 9 14, 10 13, 12 13 C 14 13, 15 14, 15 16 C 15 19, 14 22, 12 22 Z" />
                <path d="M22 12 C 22 14, 19 15, 16 15 C 14 15, 13 14, 13 12 C 13 10, 14 9, 16 9 C 19 9, 22 10, 22 12 Z" />
                <path d="M2 12 C 2 10, 5 9, 8 9 C 10 9, 11 10, 11 12 C 11 14, 10 15, 8 15 C 5 15, 2 14, 2 12 Z" />
              </svg>
            }
          />
          <SpectrumButton currentMode={currentMode} onModeChange={onModeChange}
            mode={VisualizerMode.PULSE_CIRCLES}
            label="PULSE"
            icon={
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="4" />
                <circle cx="12" cy="12" r="8" opacity="0.5" />
                <circle cx="12" cy="12" r="11" opacity="0.25" />
              </svg>
            }
          />
          <SpectrumButton currentMode={currentMode} onModeChange={onModeChange}
            mode={VisualizerMode.JELLY_WAVE}
            label="JELLY WAVE"
            icon={
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  d="M2 12c2 4 4 4 6 0s4-4 6 0 4 4 6 0"
                  strokeLinecap="round"
                />
                <path
                  d="M2 16c2 4 4 4 6 0s4-4 6 0 4 4 6 0"
                  strokeLinecap="round"
                  opacity="0.5"
                />
              </svg>
            }
          />
          <SpectrumButton currentMode={currentMode} onModeChange={onModeChange}
            mode={VisualizerMode.FLUID}
            label="FLUID"
            icon={
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path
                  d="M12 22c4.97 0 9-4.03 9-9c0-4.97-9-13-9-13S3 8.03 3 13c0 4.97 4.03 9 9 9z"
                  opacity="0.3"
                />
                <path
                  d="M12 22c4.97 0 9-4.03 9-9c0-3-4-8-7-10.5C12 4.8 12 22 12 22z"
                  fill="white"
                  fillOpacity="0.5"
                />
              </svg>
            }
          />
          <SpectrumButton currentMode={currentMode} onModeChange={onModeChange}
            mode={VisualizerMode.PARTICLES}
            label="PARTICLES"
            icon={
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <circle cx="4" cy="18" r="1.5" />
                <circle cx="10" cy="12" r="2.5" />
                <circle cx="18" cy="8" r="3.5" />
                <circle cx="20" cy="18" r="1.5" />
                <circle cx="8" cy="6" r="1" />
                <circle cx="14" cy="20" r="1" />
                <circle cx="16" cy="4" r="1.5" />
              </svg>
            }
          />
          <SpectrumButton currentMode={currentMode} onModeChange={onModeChange}
            mode={VisualizerMode.DOT_WAVE}
            label="DOT WAVE"
            icon={
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <circle cx="2" cy="12" r="1.5" />
                <circle cx="6" cy="12" r="1.5" />
                <circle cx="10" cy="8" r="1.5" />
                <circle cx="10" cy="16" r="1.5" />
                <circle cx="14" cy="4" r="1.5" />
                <circle cx="14" cy="20" r="1.5" />
                <circle cx="18" cy="8" r="1.5" />
                <circle cx="18" cy="16" r="1.5" />
                <circle cx="22" cy="12" r="1.5" />
              </svg>
            }
          />
          <SpectrumButton currentMode={currentMode} onModeChange={onModeChange}
            mode={VisualizerMode.LED_BARS}
            label="LED BARS"
            icon={
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <rect x="3" y="10" width="4" height="11" rx="1" />
                <rect x="9" y="6" width="4" height="15" rx="1" />
                <rect x="15" y="14" width="4" height="7" rx="1" />
                <rect
                  x="4"
                  y="11"
                  width="2"
                  height="2"
                  fill="white"
                  fillOpacity="0.3"
                />
                <rect
                  x="10"
                  y="7"
                  width="2"
                  height="2"
                  fill="white"
                  fillOpacity="0.3"
                />
                <rect
                  x="16"
                  y="15"
                  width="2"
                  height="2"
                  fill="white"
                  fillOpacity="0.3"
                />
              </svg>
            }
          />
          <SpectrumButton currentMode={currentMode} onModeChange={onModeChange}
            mode={VisualizerMode.SPECTRUM}
            label="SPECTRUM"
            icon={
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <circle cx="4" cy="12" r="2" />
                <circle cx="8" cy="12" r="2" />
                <circle cx="12" cy="12" r="2" />
                <circle cx="16" cy="12" r="2" />
                <circle cx="20" cy="12" r="2" />
                <circle cx="12" cy="8" r="2" />
                <circle cx="12" cy="16" r="2" />
                <circle cx="16" cy="8" r="2" />
                <circle cx="8" cy="16" r="2" />
              </svg>
            }
          />
          <SpectrumButton currentMode={currentMode} onModeChange={onModeChange}
            mode={VisualizerMode.AURORA}
            label="AURORA"
            icon={
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  d="M2 12 C 6 6, 12 6, 15 12 S 22 18, 22 12"
                  strokeLinecap="round"
                />
                <path
                  d="M2 15 C 6 9, 12 9, 15 15 S 22 21, 22 15"
                  strokeLinecap="round"
                  opacity="0.5"
                />
              </svg>
            }
          />
          <SpectrumButton currentMode={currentMode} onModeChange={onModeChange}
            mode={VisualizerMode.CIRCULAR}
            label="CIRCLE"
            icon={
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="7" />
                <path d="M12 5v2M12 17v2M5 12h2M17 12h2" />
              </svg>
            }
          />
          <SpectrumButton currentMode={currentMode} onModeChange={onModeChange}
            mode={VisualizerMode.DUAL_BARS}
            label="DUAL"
            icon={
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M4 10h4v4H4zM10 6h4v12h-4zM16 11h4v2h-4z" />
              </svg>
            }
          />
          <SpectrumButton currentMode={currentMode} onModeChange={onModeChange}
            mode={VisualizerMode.RIPPLE}
            label="RIPPLE"
            icon={
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="3" />
                <circle cx="12" cy="12" r="7" opacity="0.6" />
                <circle cx="12" cy="12" r="10" opacity="0.3" />
              </svg>
            }
          />
          <SpectrumButton currentMode={currentMode} onModeChange={onModeChange}
            mode={VisualizerMode.PIXEL}
            label="PIXEL"
            icon={
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <rect x="4" y="14" width="4" height="4" />
                <rect x="10" y="8" width="4" height="4" />
                <rect x="10" y="14" width="4" height="4" />
                <rect x="16" y="10" width="4" height="4" />
                <rect x="16" y="14" width="4" height="4" />
              </svg>
            }
          />
          <SpectrumButton currentMode={currentMode} onModeChange={onModeChange}
            mode={VisualizerMode.ROUNDED_BARS}
            label="ROUND BARS"
            icon={
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <rect x="4" y="10" width="4" height="11" rx="2" />
                <rect x="10" y="5" width="4" height="16" rx="2" />
                <rect x="16" y="12" width="4" height="9" rx="2" />
              </svg>
            }
          />
          <SpectrumButton currentMode={currentMode} onModeChange={onModeChange}
            mode={VisualizerMode.STARBURST}
            label="BURST"
            icon={
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M12 2v4M12 18v4M2 12h4M18 12h4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
              </svg>
            }
          />
          <SpectrumButton currentMode={currentMode} onModeChange={onModeChange}
            mode={VisualizerMode.BUTTERFLY}
            label="WINGS"
            icon={
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M12 12c0-3 2-6 6-6s4 2 4 6-2 6-4 6-6-3-6-6z" />
                <path d="M12 12c0-3-2-6-6-6s-4 2-4 6 2 6 4 6 6-3 6-6z" />
              </svg>
            }
          />
        </div>
      </div>

      {/* 2. Video Effects */}
      <div className="p-4 pt-0">
        <div className="flex items-center mb-4 mt-2">
          <span className="text-xs font-bold text-app-textMuted uppercase tracking-widest pl-1">
            효과 (FX)
          </span>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {/* Transform Group */}
          <EffectButton
            active={settings.effects.mirror}
            label="좌우 대칭"
            onClick={() => toggleEffect("mirror")}
            icon={
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M12 3v18M5 9l-3 3 3 3M19 9l3 3-3 3" />
              </svg>
            }
          />
          <EffectButton
            active={settings.effects.pulse}
            label="비트 줌"
            onClick={() => toggleEffect("pulse")}
            icon={
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M8 12h8" />
              </svg>
            }
          />
          <EffectButton
            active={settings.effects.shake}
            label="화면 진동"
            onClick={() => toggleEffect("shake")}
            icon={
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M2 12h2M20 12h2M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
              </svg>
            }
          />

          {/* Atmosphere Group */}
          <EffectButton
            active={settings.effects.snow}
            label="눈 (Snow)"
            onClick={() => toggleEffect("snow")}
            icon={
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
              </svg>
            }
          />
          <EffectButton
            active={settings.effects.rain}
            label="비 (Rain)"
            onClick={() => toggleEffect("rain")}
            icon={
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M8 2v6M12 2v8M16 2v5M8 14v4M12 16v4M16 12v4" />
              </svg>
            }
          />
          <EffectButton
            active={settings.effects.raindrops}
            label="창문 빗방울"
            onClick={() => toggleEffect("raindrops")}
            icon={
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
              </svg>
            }
          />
          <EffectButton
            active={settings.effects.particles}
            label="부유 먼지"
            onClick={() => toggleEffect("particles")}
            icon={
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="4" cy="4" r="1" />
                <circle cx="12" cy="10" r="1" />
                <circle cx="20" cy="5" r="1" />
                <circle cx="8" cy="18" r="1" />
                <circle cx="18" cy="16" r="1" />
              </svg>
            }
          />
          <EffectButton
            active={settings.effects.fireflies}
            label="반딧불"
            onClick={() => toggleEffect("fireflies")}
            icon={
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="4" />
                <path d="M12 8v-4M12 20v-4M4 12h4M20 12h-4" opacity="0.6" />
              </svg>
            }
          />
          <EffectButton
            active={settings.effects.fireworks}
            label="불꽃놀이"
            onClick={() => toggleEffect("fireworks")}
            icon={
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M12 12m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0" />
                <path d="M12 2v4M12 18v4M2 12h4M18 12h4M4.9 4.9l2.8 2.8M16.2 16.2l2.8 2.8M4.9 19.1l2.8-2.8M16.2 7.8l2.8-2.8" />
              </svg>
            }
          />
          <EffectButton
            active={settings.effects.starfield}
            label="별밤"
            onClick={() => toggleEffect("starfield")}
            icon={
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            }
          />
          <EffectButton
            active={settings.effects.fog}
            label="안개"
            onClick={() => toggleEffect("fog")}
            icon={
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M5 15h14M3 18h18M7 12h10M9 9h6" />
              </svg>
            }
          />

          {/* Overlay Group */}
          <EffectButton
            active={settings.effects.filmGrain}
            label="필름 그레인"
            onClick={() => toggleEffect("filmGrain")}
            icon={
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <rect x="2" y="2" width="20" height="20" rx="2" />
                <path d="M6 6h.01M10 6h.01M14 6h.01M18 6h.01M6 10h.01M10 10h.01M14 10h.01M18 10h.01M6 14h.01M10 14h.01M14 14h.01M18 14h.01" />
              </svg>
            }
          />
          <EffectButton
            active={settings.effects.vignette}
            label="비네팅"
            onClick={() => toggleEffect("vignette")}
            icon={
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="10" />
                <circle cx="12" cy="12" r="6" strokeDasharray="4 4" />
              </svg>
            }
          />
          <EffectButton
            active={settings.effects.scanlines}
            label="스캔라인"
            onClick={() => toggleEffect("scanlines")}
            icon={
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M2 4h20M2 8h20M2 12h20M2 16h20M2 20h20" />
              </svg>
            }
          />
          <EffectButton
            active={settings.effects.glitch}
            label="글리치"
            onClick={() => toggleEffect("glitch")}
            icon={
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M4 14h6M14 14h6M4 10h4M12 10h8M4 18h16M4 6h16" />
              </svg>
            }
          />
        </div>
      </div>

      <div className="mt-auto p-4 border-t border-app-border/50 bg-app-bg text-center">
        <p className="text-[11px] text-app-textMuted font-mono tracking-wide">
          POST-PROCESSING READY
        </p>
      </div>
    </div>
  );
};

export default PresetPanel;
