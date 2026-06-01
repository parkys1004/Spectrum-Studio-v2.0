import React from 'react';
import { VisualizerSettings } from '../types';
import PropertyRow from './controls/PropertyRow';
import ColorRow from './controls/ColorRow';
import ImageUploadRow from './controls/ImageUploadRow';

interface EffectControlsProps {
  visualizerSettings: VisualizerSettings;
  onVisualizerChange: (newSettings: VisualizerSettings) => void;
}

const EffectControls: React.FC<EffectControlsProps> = ({ 
    visualizerSettings, 
    onVisualizerChange 
}) => {
  
  const handleVisualChange = (key: keyof VisualizerSettings, value: string | number | null) => {
    onVisualizerChange({ ...visualizerSettings, [key]: value });
  };

  const handleEffectParamChange = (key: keyof VisualizerSettings['effectParams'], value: number) => {
      onVisualizerChange({
          ...visualizerSettings,
          effectParams: {
              ...visualizerSettings.effectParams,
              [key]: value
          }
      });
  };

  const handleImageUpload = (key: 'backgroundImage' | 'logoImage' | 'stickerImage', file: File) => {
      const url = URL.createObjectURL(file);
      handleVisualChange(key, url);
  };

  const SectionTitle = ({ label }: { label: string }) => (
      <div className="px-6 py-4 mt-2 mb-2 text-xs text-app-textMuted font-bold uppercase tracking-[0.2em] flex items-center select-none">
         <div className="w-2.5 h-2.5 rounded-full bg-app-border mr-2"></div>
         {label}
      </div>
  );

  return (
    <div className="flex flex-col min-h-full bg-app-bg pb-6">
      
      {/* Visualizer Effects Section */}
      <SectionTitle label="기본 설정 (PARAMETERS)" />
      <div className="px-2">
         <div className="flex items-center justify-between px-4 py-3 bg-app-bg border-b border-app-border hover:bg-app-panel transition-colors">
            <span className="text-sm font-medium text-app-text select-none">미리보기 비율</span>
            <select
               value={visualizerSettings.resolution || '1080p'}
               onChange={(e) => handleVisualChange('resolution', e.target.value)}
               className="text-sm bg-app-bg border border-app-border rounded-lg px-3 py-1.5 text-app-text focus:outline-none focus:ring-2 focus:ring-app-accent focus:border-transparent shadow-sm"
            >
               <option value="1080p">가로 FHD (16:9)</option>
               <option value="720p">가로 HD (16:9)</option>
               <option value="1080p_vertical">세로 FHD (9:16)</option>
               <option value="720p_vertical">세로 HD (9:16)</option>
               <option value="1080p_square">정방형 (1:1)</option>
            </select>
         </div>
         <ColorRow 
            label="테마 색상"
            value={visualizerSettings.color}
            onChange={(v) => handleVisualChange('color', v)}
         />
         <PropertyRow
            label="확대/축소"
            value={visualizerSettings.scale}
            min={0.1}
            max={5.0}
            step={0.01}
            onChange={(v) => handleVisualChange('scale', v)}
         />
         <PropertyRow
            label="가로 위치"
            value={visualizerSettings.positionX}
            min={-1000}
            max={1000}
            step={1}
            onChange={(v) => handleVisualChange('positionX', v)}
         />
         <PropertyRow
            label="세로 위치"
            value={visualizerSettings.positionY}
            min={-1000}
            max={1000}
            step={1}
            onChange={(v) => handleVisualChange('positionY', v)}
         />
         <PropertyRow
            label="선 두께"
            value={visualizerSettings.lineThickness}
            min={1}
            max={100}
            step={1}
            onChange={(v) => handleVisualChange('lineThickness', v)}
            suffix="px"
         />
         <PropertyRow
            label="테두리 둥글기"
            value={visualizerSettings.roundness ?? 0}
            min={0}
            max={30}
            step={1}
            onChange={(v) => handleVisualChange('roundness', v)}
            suffix="px"
         />
         <PropertyRow
            label="반응 감도"
            value={visualizerSettings.amplitude}
            min={0.1}
            max={5.0}
            step={0.05}
            onChange={(v) => handleVisualChange('amplitude', v)}
         />
         <PropertyRow
            label="부드러움"
            value={visualizerSettings.sensitivity}
            min={0.1}
            max={0.99}
            step={0.01}
            onChange={(v) => handleVisualChange('sensitivity', v)}
         />
      </div>

       {/* Effect Fine-Tuning Section */}
       <SectionTitle label="효과 상세 (FX DETAILS)" />
      <div className="px-2">
        <PropertyRow
            label="속도"
            value={visualizerSettings.effectParams.speed}
            min={0.1}
            max={3.0}
            step={0.1}
            onChange={(v) => handleEffectParamChange('speed', v)}
            suffix="x"
         />
         <PropertyRow
            label="밀도/강도"
            value={visualizerSettings.effectParams.intensity}
            min={0.1}
            max={3.0}
            step={0.1}
            onChange={(v) => handleEffectParamChange('intensity', v)}
            suffix="x"
         />
         <PropertyRow
            label="진동 세기"
            value={visualizerSettings.effectParams.shakeStrength}
            min={0.0}
            max={2.0}
            step={0.1}
            onChange={(v) => handleEffectParamChange('shakeStrength', v)}
         />
         <PropertyRow
            label="글리치 강도"
            value={visualizerSettings.effectParams.glitchStrength}
            min={0.0}
            max={2.0}
            step={0.1}
            onChange={(v) => handleEffectParamChange('glitchStrength', v)}
         />
      </div>

      {/* Assets Section */}
      <SectionTitle label="오버레이 (OVERLAYS)" />
      <div className="px-2">
        <ImageUploadRow 
            label="배경 (이미지/영상)"
            currentImage={visualizerSettings.backgroundImage}
            onUpload={(file) => handleImageUpload('backgroundImage', file)}
            onRemove={() => handleVisualChange('backgroundImage', null)}
        />
        <ImageUploadRow 
            label="로고"
            currentImage={visualizerSettings.logoImage}
            onUpload={(file) => handleImageUpload('logoImage', file)}
            onRemove={() => handleVisualChange('logoImage', null)}
        />
        {/* Logo Transformations */}
        {visualizerSettings.logoImage && (
            <div className="mx-4 mb-4 p-3 rounded-xl bg-app-bg shadow-neu-pressed">
                 <div className="text-xs text-app-accent font-bold mb-2 flex items-center">
                    <div className="w-2 h-2 bg-app-accent rounded-full mr-2"></div>
                    로고 위치/크기
                 </div>
                 <PropertyRow
                    label="크기"
                    value={visualizerSettings.logoScale || 1.0}
                    min={0.1}
                    max={10.0}
                    step={0.01}
                    onChange={(v) => handleVisualChange('logoScale', v)}
                 />
                 <PropertyRow
                    label="가로 %"
                    value={visualizerSettings.logoX ?? 95}
                    min={0}
                    max={100}
                    step={1}
                    onChange={(v) => handleVisualChange('logoX', v)}
                    suffix="%"
                 />
                 <PropertyRow
                    label="세로 %"
                    value={visualizerSettings.logoY ?? 5}
                    min={0}
                    max={100}
                    step={1}
                    onChange={(v) => handleVisualChange('logoY', v)}
                    suffix="%"
                 />
            </div>
        )}

        <ImageUploadRow 
            label="스티커/GIF"
            currentImage={visualizerSettings.stickerImage}
            onUpload={(file) => handleImageUpload('stickerImage', file)}
            onRemove={() => handleVisualChange('stickerImage', null)}
        />
        {/* Sticker Transformations */}
        {visualizerSettings.stickerImage && (
            <div className="mx-4 mb-4 p-3 rounded-xl bg-app-bg shadow-neu-pressed">
                 <div className="text-xs text-app-accent font-bold mb-2 flex items-center">
                    <div className="w-2 h-2 bg-app-accent rounded-full mr-2"></div>
                    스티커 위치/크기
                 </div>
                 <PropertyRow
                    label="크기"
                    value={visualizerSettings.stickerScale || 1.0}
                    min={0.1}
                    max={10.0}
                    step={0.01}
                    onChange={(v) => handleVisualChange('stickerScale', v)}
                 />
                 <PropertyRow
                    label="가로 %"
                    value={visualizerSettings.stickerX ?? 50}
                    min={0}
                    max={100}
                    step={1}
                    onChange={(v) => handleVisualChange('stickerX', v)}
                    suffix="%"
                 />
                 <PropertyRow
                    label="세로 %"
                    value={visualizerSettings.stickerY ?? 50}
                    min={0}
                    max={100}
                    step={1}
                    onChange={(v) => handleVisualChange('stickerY', v)}
                    suffix="%"
                 />
            </div>
        )}
      </div>

       <div className="mt-8 px-6">
        <button 
          onClick={() => {
              onVisualizerChange({ 
                  color: '#8b5cf6', 
                  lineThickness: 2, 
                  roundness: 0,
                  amplitude: 1.0, 
                  sensitivity: 0.85,
                  backgroundImage: null,
                  logoImage: null,
                  scale: 1.0,
                  positionX: 0,
                  positionY: 0,
                  logoScale: 1.0,
                  logoX: 95,
                  logoY: 5,
                  stickerImage: null,
                  stickerScale: 1.0,
                  stickerX: 50,
                  stickerY: 50,
                  effects: {
                    mirror: false,
                    pulse: false,
                    shake: false,
                    glitch: false,
                    snow: false,
                    rain: false,
                    raindrops: false,
                    particles: false,
                    fireworks: false,
                    starfield: false,
                    fog: false,
                    fireflies: false,
                    filmGrain: false,
                    vignette: false,
                    scanlines: false
                  },
                  effectParams: {
                      speed: 1.0,
                      intensity: 1.0,
                      shakeStrength: 1.0,
                      glitchStrength: 1.0
                  }
              });
          }}
          className="w-full py-3 text-sm bg-app-bg text-app-textMuted rounded-xl font-bold tracking-wide shadow-neu-btn active:shadow-neu-pressed hover:text-red-500 transition-all"
        >
          초기화 (RESET)
        </button>
      </div>
    </div>
  );
};

export default EffectControls;