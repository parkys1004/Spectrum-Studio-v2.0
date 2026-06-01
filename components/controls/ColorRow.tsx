import React from 'react';

interface ColorRowProps {
    label: string;
    value: string;
    onChange: (val: string) => void;
}

const ColorRow: React.FC<ColorRowProps> = ({
    label,
    value,
    onChange
}) => {
    const isRainbow = value === 'rainbow';

    return (
        <div className="flex items-center py-3 px-4 select-none">
            <div className="w-20 text-xs text-app-textMuted font-bold uppercase tracking-wider truncate shrink-0">{label}</div>
            <div className="flex-1 mx-3 flex justify-end items-center space-x-2">
                
                {/* Rainbow Button */}
                <button
                    onClick={() => onChange(isRainbow ? '#8b5cf6' : 'rainbow')}
                    className={`h-8 px-3 rounded-lg flex items-center justify-center transition-all shadow-neu-btn active:shadow-neu-pressed ${
                        isRainbow 
                        ? 'ring-2 ring-app-accent ring-offset-2 ring-offset-app-bg' 
                        : 'opacity-70 hover:opacity-100'
                    }`}
                    title={isRainbow ? "무지개 모드 끄기" : "무지개 모드 켜기"}
                >
                    <div className="w-20 h-4 rounded bg-gradient-to-r from-red-500 via-green-500 to-blue-500"></div>
                </button>

                {/* Color Picker */}
                <div className={`relative overflow-hidden w-12 h-8 rounded-lg bg-app-bg shadow-neu-pressed cursor-pointer p-1 transition-all ${isRainbow ? 'opacity-50 grayscale' : ''}`}>
                     <div className="w-full h-full rounded bg-transparent relative overflow-hidden">
                        <input 
                            type="color" 
                            value={isRainbow ? '#8b5cf6' : value} 
                            onChange={(e) => onChange(e.target.value)}
                            className="absolute -top-4 -left-4 w-[200%] h-[300%] cursor-pointer p-0 border-0 opacity-0"
                            disabled={isRainbow}
                        />
                        <div className="w-full h-full rounded shadow-sm" style={{ backgroundColor: isRainbow ? '#e0e5ec' : value }}>
                            {isRainbow && (
                                <div className="absolute inset-0 flex items-center justify-center text-[10px] text-app-textMuted font-bold">OFF</div>
                            )}
                        </div>
                     </div>
                </div>
            </div>
            <div className="w-14 text-right text-app-textMuted font-mono text-[10px] uppercase ml-2 truncate">
                {isRainbow ? 'RAINBOW' : value}
            </div>
        </div>
    );
};

export default ColorRow;