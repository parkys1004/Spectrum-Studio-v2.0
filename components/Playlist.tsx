import React, { useRef, useState } from 'react';
import { Track } from '../types';

interface PlaylistProps {
  tracks: Track[];
  currentTrackId: string | null;
  selectedTrackIds: Set<string>;
  onTrackSelect: (track: Track) => void;
  onFilesAdded: (files: FileList) => void;
  onReorderTrack: (sourceId: string, targetId: string) => void;
  onDuplicateTrack: (trackId: string) => void;
  onDeleteTrack: (trackId: string) => void;
  onDeleteSelectedTracks: () => void;
  onClearLibrary: () => void;
  onToggleSelection: (trackId: string) => void;
  onToggleSelectAll: () => void;
  onCopyTimeline: () => void;
  onOpenManual: () => void;
}

const Playlist: React.FC<PlaylistProps> = ({ 
    tracks, 
    currentTrackId, 
    selectedTrackIds,
    onTrackSelect, 
    onFilesAdded,
    onReorderTrack,
    onDuplicateTrack,
    onDeleteTrack,
    onDeleteSelectedTracks,
    onClearLibrary,
    onToggleSelection,
    onToggleSelectAll,
    onCopyTimeline,
    onOpenManual
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Drag and Drop State
  const [draggedTrackId, setDraggedTrackId] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, trackId: string) => {
      e.dataTransfer.setData('trackId', trackId);
      setDraggedTrackId(trackId);
      e.dataTransfer.effectAllowed = "move";
  };

  const handleDropOnTrack = (e: React.DragEvent, targetId: string) => {
      e.preventDefault();
      e.stopPropagation();
      const sourceId = e.dataTransfer.getData('trackId');
      if (sourceId && sourceId !== targetId) {
          onReorderTrack(sourceId, targetId);
      }
      setDraggedTrackId(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      e.dataTransfer.dropEffect = "move";
  };

  const IconButton = ({ onClick, icon, label, variant = 'default', active = false }: { onClick: () => void, icon: React.ReactNode, label: string, variant?: 'default' | 'danger', active?: boolean }) => (
      <button 
        onClick={onClick}
        className={`flex-1 flex items-center justify-center space-x-1.5 py-2 px-3 rounded-xl shadow-neu-btn active:shadow-neu-pressed transition-all duration-200 group ${
            variant === 'danger' 
            ? 'bg-app-bg text-red-400 hover:text-red-500 hover:bg-red-50' 
            : active 
                ? 'bg-app-bg text-app-accent shadow-neu-pressed'
                : 'bg-app-bg text-app-text hover:text-app-accent'
        }`}
        title={label}
      >
        <span className="transition-colors">{icon}</span>
      </button>
  );

  return (
    <div className="flex flex-col h-full bg-app-bg">
      {/* Primary Action Button: Import */}
      <div className="p-4 pb-0">
          <button 
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-4 rounded-xl bg-app-accent text-white font-bold text-lg shadow-lg shadow-violet-500/30 active:scale-[0.98] transition-all flex items-center justify-center space-x-2 group hover:bg-violet-600"
          >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
              <span>파일 가져오기</span>
          </button>
      </div>

      {/* Secondary Toolbar */}
      <div className="px-4 py-3 flex space-x-2">
        <IconButton 
            onClick={onToggleSelectAll}
            label={selectedTrackIds.size === tracks.length && tracks.length > 0 ? "전체 해제" : "전체 선택"}
            active={selectedTrackIds.size === tracks.length && tracks.length > 0}
            icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>}
        />
        <IconButton 
            onClick={onCopyTimeline}
            label="타임라인 복사"
            icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="2" ry="2"/><path d="M12 12v6"/><path d="M12 18l3-3"/><path d="M12 18l-3-3"/></svg>}
        />
        {selectedTrackIds.size > 0 ? (
            <IconButton 
                onClick={onDeleteSelectedTracks}
                label={`선택 삭제 (${selectedTrackIds.size})`}
                variant="danger"
                icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>}
            />
        ) : (
            <IconButton 
                onClick={onClearLibrary}
                label="전체 초기화"
                variant="danger"
                icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>}
            />
        )}
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept="audio/*" 
          multiple 
          onChange={(e) => e.target.files && onFilesAdded(e.target.files)}
        />
      </div>

      {/* File List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
          {/* Tracks */}
          {tracks.map((track) => {
              const isActive = track.id === currentTrackId;
              const isSelected = selectedTrackIds.has(track.id);
              const isDragging = draggedTrackId === track.id;

              return (
                <div 
                  key={track.id} 
                  onClick={() => onTrackSelect(track)}
                  draggable
                  onDragStart={(e) => handleDragStart(e, track.id)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDropOnTrack(e, track.id)}
                  className={`group flex items-center px-4 py-3 rounded-xl cursor-pointer transition-all ${
                    isActive 
                      ? 'bg-app-bg shadow-neu-pressed text-app-accent' 
                      : 'bg-app-bg shadow-neu-flat text-app-text hover:-translate-y-px'
                  } ${isDragging ? 'opacity-50 dashed border-gray-400' : ''}`}
                >
                   {/* Drag Handle */}
                   <div className="mr-3 opacity-0 group-hover:opacity-30 cursor-grab active:cursor-grabbing text-app-textMuted">
                       <svg width="8" height="12" viewBox="0 0 6 10" fill="currentColor">
                           <circle cx="1" cy="1" r="1" />
                           <circle cx="1" cy="5" r="1" />
                           <circle cx="1" cy="9" r="1" />
                           <circle cx="5" cy="1" r="1" />
                           <circle cx="5" cy="5" r="1" />
                           <circle cx="5" cy="9" r="1" />
                       </svg>
                   </div>

                    {/* Selection Checkbox */}
                   <div 
                        className={`mr-3 transition-colors ${isSelected ? 'text-app-accent' : 'text-app-textMuted hover:text-app-textMuted'}`}
                        onClick={(e) => {
                            e.stopPropagation();
                            onToggleSelection(track.id);
                        }}
                   >
                       {isSelected ? (
                           <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
                       ) : (
                           <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/></svg>
                       )}
                   </div>

                   {/* Status Indicator (Only if active) */}
                   {isActive && (
                       <div className="w-2.5 h-2.5 rounded-full mr-3 shrink-0 bg-app-accent shadow-[0_0_8px_rgba(139,92,246,0.6)] animate-pulse"></div>
                   )}
                   
                   <div className="flex-1 min-w-0 flex flex-col">
                        <span className="text-sm font-medium tracking-wide truncate">{track.name}</span>
                        {track.duration > 0 && (
                            <span className="text-[10px] text-app-textMuted font-mono mt-0.5">
                                {Math.floor(track.duration / 60)}:{(Math.floor(track.duration) % 60).toString().padStart(2, '0')}
                            </span>
                        )}
                   </div>
                   
                   {/* Audio Wave Animation */}
                   {isActive && (
                       <div className="flex space-x-0.5 ml-2 items-end h-3">
                           <div className="w-0.5 bg-app-accent animate-[bounce_1s_infinite] h-2 rounded-full"></div>
                           <div className="w-0.5 bg-app-accent animate-[bounce_1.2s_infinite] h-3 rounded-full"></div>
                           <div className="w-0.5 bg-app-accent animate-[bounce_0.8s_infinite] h-1.5 rounded-full"></div>
                       </div>
                   )}

                   {/* Duplicate Button */}
                   <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onDuplicateTrack(track.id);
                        }}
                        className="ml-2 p-2 rounded-full text-app-textMuted hover:text-blue-500 hover:shadow-neu-pressed transition-all opacity-0 group-hover:opacity-100"
                        title="트랙 복제"
                        aria-label="Duplicate track"
                   >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                   </button>

                   {/* Delete Button */}
                   <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onDeleteTrack(track.id);
                        }}
                        className="ml-1 p-2 rounded-full text-app-textMuted hover:text-red-500 hover:shadow-neu-pressed transition-all opacity-0 group-hover:opacity-100"
                        title="삭제"
                        aria-label="Delete track"
                   >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                   </button>
                </div>
              );
          })}

          {tracks.length === 0 && (
              <div className="flex flex-col items-center justify-center py-10 opacity-40 text-center">
                  <div className="p-4 rounded-full bg-app-bg shadow-neu-flat mb-3">
                     <svg className="w-8 h-8 text-app-textMuted" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" /></svg>
                  </div>
                  <p className="text-xs uppercase tracking-widest text-app-textMuted">트랙 없음</p>
              </div>
          )}
      </div>

      {/* Kmong Promotion Button & Credit */}
      <div className="px-4 pt-2 pb-1 bg-app-bg border-t border-app-border/40">
          <button 
              onClick={onOpenManual}
              className="group flex items-center justify-center w-full py-2.5 mb-2 text-xs font-bold text-app-textMuted bg-app-bg rounded-xl shadow-neu-btn active:shadow-neu-pressed hover:text-app-accent transition-all uppercase tracking-wide"
          >
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
              <span>사용 설명서</span>
          </button>
          
          <a 
              href="https://kmong.com/self-marketing/730531/ZQh4nXZpK5" 
              target="_blank" 
              rel="noopener noreferrer"
              className="group flex items-center justify-center w-full py-2.5 text-xs font-bold text-app-text bg-app-bg rounded-xl shadow-neu-btn active:shadow-neu-pressed hover:text-yellow-600 transition-all uppercase tracking-wide"
          >
              <span className="mr-2 text-yellow-500 text-sm">★</span> 
              <span>크몽 방문하기</span>
          </a>
          <div className="mt-3 mb-1 text-center">
              <span className="text-[11px] font-black text-app-textMuted tracking-[0.2em] uppercase drop-shadow-sm">
                  Produced by 5barTV
              </span>
          </div>
      </div>
      
      {/* Footer Status */}
      <div className="px-5 py-3 text-[11px] text-app-textMuted flex justify-between tracking-wider font-mono">
        <span>TRACKS: {tracks.length}</span>
        <span>SELECTED: {selectedTrackIds.size}</span>
      </div>
    </div>
  );
};

export default Playlist;