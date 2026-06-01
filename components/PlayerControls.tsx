import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Track, VisualizerMode } from '../types';
import { audioService } from '../services/audioService';

interface PlayerControlsProps {
  currentTrack: Track | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  onPlayPause: () => void;
  onSeek: (time: number) => void;
  onNext: () => void;
  onPrev: () => void;
  visualizerMode: VisualizerMode | null;
  onModeChange: (mode: VisualizerMode | null) => void;
}

const PlayerControls: React.FC<PlayerControlsProps> = ({
  currentTrack,
  isPlaying,
  currentTime,
  duration,
  onPlayPause,
  onSeek,
  onNext,
  onPrev
}) => {
  const timelineRef = useRef<HTMLDivElement>(null);
  const waveformCanvasRef = useRef<HTMLCanvasElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);

  useEffect(() => {
    let isCancelled = false;
    setAudioBuffer(null);
    const loadWaveform = async () => {
      if (!currentTrack || !currentTrack.file) return;
      const buffer = await audioService.getAudioBuffer(currentTrack.file, currentTrack.id);
      if (!isCancelled) setAudioBuffer(buffer);
    };
    loadWaveform();
    return () => { isCancelled = true; };
  }, [currentTrack?.id, currentTrack?.file]); 

  useEffect(() => {
    const canvas = waveformCanvasRef.current;
    if (!canvas || !timelineRef.current) return;
    const parent = canvas.parentElement;
    if (parent) {
      canvas.width = parent.clientWidth;
      canvas.height = parent.clientHeight;
    }
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    if (!audioBuffer) {
        if (currentTrack) {
             ctx.fillStyle = '#a0aec0';
             ctx.font = '14px Pretendard';
             ctx.fillText("LOADING WAVEFORM...", 14, height / 2 + 5);
        }
        return;
    }

    const data = audioBuffer.getChannelData(0); 
    const step = Math.ceil(data.length / width);
    const amp = height / 2;

    // Violet Waveform for Neumorphism
    ctx.fillStyle = '#8b5cf6'; 
    ctx.beginPath();
    for (let i = 0; i < width; i++) {
      let min = 1.0;
      let max = -1.0;
      for (let j = 0; j < step; j++) {
        const datum = data[(i * step) + j];
        if (datum < min) min = datum;
        if (datum > max) max = datum;
      }
      const yMin = (1 + min) * amp;
      const yMax = (1 + max) * amp;
      ctx.fillRect(i, yMin, 1, Math.max(1, yMax - yMin));
    }
  }, [audioBuffer, currentTrack]);

  const handleSeek = useCallback((clientX: number) => {
    if (!timelineRef.current || !duration) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, x / rect.width));
    onSeek(percentage * duration);
  }, [duration, onSeek]);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsDragging(true);
    handleSeek(e.clientX);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) handleSeek(e.clientX);
    };
    const handleMouseUp = () => setIsDragging(false);
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleSeek]);

  const formatTimeCode = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const frames = Math.floor((seconds % 1) * 30); 
    return (
      <div className="flex space-x-1 text-base font-bold text-app-textMuted">
        <span>{mins.toString().padStart(2, '0')}</span>
        <span className="opacity-50">:</span>
        <span>{secs.toString().padStart(2, '0')}</span>
        <span className="opacity-50">:</span>
        <span className="text-app-text">{frames.toString().padStart(2, '0')}</span>
      </div>
    );
  };

  const playheadPercent = duration ? (currentTime / duration) * 100 : 0;

  return (
    <div className="flex flex-col h-full bg-app-bg select-none">
      
      {/* Timeline Control Bar */}
      <div className="h-20 border-b border-app-border/40 flex items-center px-6 justify-between">
        
        {/* Timecode Box */}
        <div className="px-4 py-2 rounded-xl bg-app-bg shadow-neu-pressed flex items-center">
           {formatTimeCode(currentTime)}
        </div>
        
        {/* Transport Controls */}
        <div className="flex items-center space-x-8">
            <button 
                onClick={onPrev} 
                className="w-12 h-12 rounded-full bg-app-bg shadow-neu-btn flex items-center justify-center text-app-textMuted hover:text-app-accent active:shadow-neu-pressed transition-all"
            >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/></svg>
            </button>
            
            {/* Play Button - Large Soft UI */}
            <button 
                onClick={onPlayPause} 
                className={`w-16 h-16 rounded-full flex items-center justify-center text-app-accent transition-all ${
                    isPlaying 
                    ? 'bg-app-bg shadow-neu-pressed text-app-accent' 
                    : 'bg-app-bg shadow-neu-flat hover:-translate-y-1'
                }`}
                title={isPlaying ? "일시정지" : "재생"}
            >
                {isPlaying ? (
                     <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                ) : (
                     <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor" className="ml-1"><path d="M8 5v14l11-7z"/></svg>
                )}
            </button>
            
            <button 
                onClick={onNext} 
                className="w-12 h-12 rounded-full bg-app-bg shadow-neu-btn flex items-center justify-center text-app-textMuted hover:text-app-accent active:shadow-neu-pressed transition-all"
            >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>
            </button>
        </div>

        {/* Decor */}
        <div className="flex space-x-2 opacity-30">
             <div className="w-2.5 h-2.5 rounded-full bg-app-textMuted shadow-neu-thin"></div>
             <div className="w-2.5 h-2.5 rounded-full bg-app-textMuted shadow-neu-thin"></div>
        </div>
      </div>

      {/* Main Timeline Area */}
      <div className="flex-1 flex overflow-hidden bg-app-bg relative">
         {/* Track Headers */}
         <div className="w-20 bg-app-bg border-r border-app-border/40 flex flex-col pt-8 z-10 shadow-neu-flat">
             <div className="flex flex-col items-center space-y-8">
                 <div className="w-10 h-10 rounded-lg bg-app-bg shadow-neu-btn flex items-center justify-center text-xs font-bold text-app-textMuted">V1</div>
                 <div className="w-10 h-10 rounded-lg bg-app-bg shadow-neu-pressed flex items-center justify-center text-xs font-bold text-app-accent">A1</div>
             </div>
         </div>

         {/* Tracks & Ruler */}
         <div 
            className="flex-1 flex flex-col relative overflow-hidden cursor-crosshair" 
            ref={timelineRef}
            onMouseDown={handleMouseDown}
         >
            {/* Ruler */}
            <div className="h-8 flex items-end relative overflow-hidden select-none bg-app-bg border-b border-app-border/40">
                <div className="absolute bottom-0 w-full h-full flex justify-between px-2">
                    {Array.from({length: 40}).map((_, i) => (
                        <div key={i} className={`w-px ${i % 5 === 0 ? 'h-3 bg-app-textMuted' : 'h-1.5 bg-app-border'}`}></div>
                    ))}
                </div>
            </div>

            {/* Playhead */}
            <div 
                className="absolute top-0 bottom-0 w-[2px] bg-red-400 z-30 pointer-events-none transition-none shadow-md"
                style={{ left: `${playheadPercent}%` }}
            >
                <div className="w-4 h-4 -ml-2 bg-red-400 absolute top-0 transform rotate-45 -translate-y-2 shadow-sm rounded-sm"></div>
            </div>

            {/* Tracks Container */}
            <div className="flex-1 p-2 space-y-2 bg-app-bg shadow-neu-pressed inset-0 m-2 rounded-xl overflow-hidden">
                {/* V1 Empty */}
                <div className="h-12 rounded-lg bg-app-border/50 relative border border-app-border/50"></div>

                {/* A1 Track (Waveform) */}
                <div className="h-24 relative p-1">
                    {currentTrack && (
                        <div className="h-full w-full bg-app-bg rounded-lg overflow-hidden relative shadow-neu-flat border border-app-border">
                            {/* Real Waveform Canvas */}
                            <canvas ref={waveformCanvasRef} className="w-full h-full absolute inset-0 block opacity-80"></canvas>
                            
                            {/* Text Overlay */}
                            <div className="absolute top-2 left-3 z-10 pointer-events-none">
                                <span className="text-xs text-app-accent font-bold bg-app-bg/80 px-2 py-1 rounded-full shadow-sm backdrop-blur-sm">
                                    {currentTrack.name}
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
         </div>
      </div>
    </div>
  );
};

export default PlayerControls;