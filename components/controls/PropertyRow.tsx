import React, { useRef, useState, useEffect, useCallback } from 'react';

interface PropertyRowProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (val: number) => void;
  suffix?: string;
}

const PropertyRow: React.FC<PropertyRowProps> = ({ 
  label, 
  value, 
  min, 
  max, 
  step = 0.01,
  onChange, 
  suffix = "" 
}) => {
  const precision = step < 0.1 ? 2 : (step < 1 ? 1 : 0);
  const [localValue, setLocalValue] = useState(value ?? 0);
  const [isDraggingSlider, setIsDraggingSlider] = useState(false);
  const [isScrubbing, setIsScrubbing] = useState(false);

  const valueRef = useRef(value ?? 0);
  const rafRef = useRef<number | null>(null);
  const startXRef = useRef(0);
  const startValRef = useRef(0);

  useEffect(() => {
      if (isDraggingSlider || isScrubbing) return;
      if (value !== undefined && value !== null && Math.abs(value - valueRef.current) > 0.0001) {
          setLocalValue(value);
          valueRef.current = value;
      }
  }, [value, isDraggingSlider, isScrubbing]);

  useEffect(() => {
      return () => {
          if (rafRef.current) cancelAnimationFrame(rafRef.current);
      };
  }, []);

  const updateParentThrottled = useCallback((newValue: number) => {
      valueRef.current = newValue;
      if (rafRef.current === null) {
          rafRef.current = requestAnimationFrame(() => {
              onChange(valueRef.current);
              rafRef.current = null;
          });
      }
  }, [onChange]);

  const updateParentImmediate = useCallback((newValue: number) => {
      if (rafRef.current) {
          cancelAnimationFrame(rafRef.current);
          rafRef.current = null;
      }
      valueRef.current = newValue;
      onChange(newValue);
  }, [onChange]);

  const handleSliderDown = () => setIsDraggingSlider(true);
  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newVal = parseFloat(e.target.value);
      setLocalValue(newVal);
      updateParentThrottled(newVal);
  };
  const handleSliderUp = () => {
      setIsDraggingSlider(false);
      updateParentImmediate(localValue);
  };

  const handleScrubDown = (e: React.PointerEvent) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      e.preventDefault();
      const target = e.currentTarget as HTMLDivElement;
      target.setPointerCapture(e.pointerId);
      setIsScrubbing(true);
      startXRef.current = e.clientX;
      startValRef.current = localValue;
      document.body.style.cursor = 'ew-resize';
  };

  const handleScrubMove = (e: React.PointerEvent) => {
      if (!isScrubbing) return;
      e.preventDefault();
      const deltaX = e.clientX - startXRef.current;
      let multiplier = (max - min) > 100 ? 0.5 : 0.05;
      let newValue = startValRef.current + (deltaX * multiplier);
      newValue = Math.max(min, Math.min(max, newValue));
      if (step > 0) newValue = Math.round(newValue / step) * step;
      setLocalValue(newValue);
      updateParentThrottled(newValue);
  };

  const handleScrubUp = (e: React.PointerEvent) => {
      if (!isScrubbing) return;
      setIsScrubbing(false);
      const target = e.currentTarget as HTMLDivElement;
      target.releasePointerCapture(e.pointerId);
      updateParentImmediate(localValue);
      document.body.style.cursor = '';
  };

  return (
    <div className="flex items-center py-3 px-4 select-none">
      <div className="w-20 text-xs text-app-textMuted font-bold uppercase tracking-wider truncate shrink-0">{label}</div>
      <div className="flex-1 mx-3 flex items-center relative h-8">
          <input
              type="range"
              min={min}
              max={max}
              step={step}
              value={localValue}
              onPointerDown={handleSliderDown}
              onChange={handleSliderChange}
              onPointerUp={handleSliderUp}
              className="w-full h-full relative z-10 touch-none cursor-pointer" 
          />
      </div>
      
      <div 
          className={`w-14 text-right transition-colors touch-none select-none cursor-ew-resize`}
          onPointerDown={handleScrubDown}
          onPointerMove={handleScrubMove}
          onPointerUp={handleScrubUp}
          onPointerCancel={handleScrubUp}
      >
          <span className={`font-mono text-xs px-2 py-1 rounded-lg transition-all inline-block min-w-[36px] text-center font-bold shadow-neu-pressed ${
              isScrubbing ? 'text-app-accent bg-app-panel' : 'text-app-text bg-app-bg'
          }`}>
              {localValue.toFixed(precision)}{suffix}
          </span>
      </div>
    </div>
  );
};

export default PropertyRow;