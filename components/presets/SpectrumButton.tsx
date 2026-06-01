import React from "react";
import { VisualizerMode } from "../../types";

interface SpectrumButtonProps {
  mode: VisualizerMode;
  label: string;
  icon: React.ReactNode;
  currentMode: VisualizerMode | null;
  onModeChange: (mode: VisualizerMode | null) => void;
}

export const SpectrumButton: React.FC<SpectrumButtonProps> = ({
  mode,
  label,
  icon,
  currentMode,
  onModeChange,
}) => {
  const isActive = currentMode === mode;
  return (
    <button
      onClick={() => onModeChange(isActive ? null : mode)}
      className={`relative w-full aspect-[4/3] rounded-2xl flex flex-col items-center justify-center p-2 transition-all duration-200 group ${
        isActive
          ? "bg-app-bg shadow-neu-pressed text-app-accent"
          : "bg-app-bg shadow-neu-btn text-app-textMuted hover:text-app-text"
      }`}
      title={label}
    >
      <div
        className={`absolute top-2 right-2 w-1.5 h-1.5 rounded-full transition-all duration-300 ${isActive ? "bg-app-accent" : "bg-transparent"}`}
      ></div>

      <div
        className={`mb-2 transform transition-transform duration-300 ${isActive ? "scale-110" : "group-hover:scale-110"}`}
      >
        {icon}
      </div>

      <span className="text-[11px] font-bold tracking-tight text-center leading-tight">
        {label}
      </span>
    </button>
  );
};
