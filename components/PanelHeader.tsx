import React from 'react';

interface PanelHeaderProps {
    title: string;
    active?: boolean;
    rightElement?: React.ReactNode;
}

export const PanelHeader: React.FC<PanelHeaderProps> = ({ 
    title, 
    active = true, 
    rightElement 
}) => (
  <div className="h-12 min-h-[48px] flex items-center px-6 select-none bg-app-bg rounded-t-3xl">
    <div className="flex items-center space-x-3">
      {/* Indicator */}
      <div className={`relative w-2 h-2 rounded-full transition-all duration-500 ${active ? 'bg-app-accent shadow-[0_0_8px_rgba(139,92,246,0.6)]' : 'bg-app-textMuted'}`}>
         {active && <div className="absolute inset-0 rounded-full bg-app-accent animate-ping opacity-30"></div>}
      </div>
      
      {/* Title */}
      <span className="text-sm font-bold text-app-text tracking-widest uppercase opacity-70">
        {title}
      </span>
    </div>
    <div className="flex-1 flex justify-end items-center h-full pl-4">
      {rightElement}
    </div>
  </div>
);

export default PanelHeader;