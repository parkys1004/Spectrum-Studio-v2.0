import React from "react";

interface EffectButtonProps {
  active: boolean;
  label: string;
  onClick: () => void;
  icon?: React.ReactNode;
}

export const EffectButton: React.FC<EffectButtonProps> = ({
  active,
  label,
  onClick,
  icon,
}) => (
  <button
    onClick={onClick}
    className={`relative w-full aspect-[4/3] rounded-2xl flex flex-col items-center justify-center p-2 transition-all duration-200 group ${
      active
        ? "bg-app-bg shadow-neu-pressed text-app-accent"
        : "bg-app-bg shadow-neu-btn text-app-textMuted hover:text-app-text"
    }`}
    title={label}
  >
    <div
      className={`absolute top-2 right-2 w-1.5 h-1.5 rounded-full transition-all duration-300 ${active ? "bg-app-accent" : "bg-transparent"}`}
    ></div>

    <div className="mb-2">
      {icon || (
        <div className="w-5 h-5 bg-current opacity-20 rounded-sm"></div>
      )}
    </div>

    <span className="text-[11px] font-bold tracking-tight text-center leading-tight">
      {label}
    </span>
  </button>
);
