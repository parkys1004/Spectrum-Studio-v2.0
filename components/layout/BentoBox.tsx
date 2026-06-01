import React from 'react';
import PanelHeader from '../PanelHeader';

interface BentoBoxProps {
    children: React.ReactNode;
    className?: string;
    title?: string;
    headerRight?: React.ReactNode;
    noPadding?: boolean;
}

const BentoBox: React.FC<BentoBoxProps> = ({ 
    children, 
    className = "", 
    title, 
    headerRight,
    noPadding = false
}) => (
    <div className={`bg-app-panel rounded-3xl shadow-neu-flat text-app-text flex flex-col overflow-hidden transition-all duration-300 ${className}`}>
        {title && <PanelHeader title={title} rightElement={headerRight} />}
        <div className={`flex-1 overflow-hidden relative flex flex-col ${noPadding ? '' : 'p-0'}`}>
            {children}
        </div>
    </div>
);

export default BentoBox;