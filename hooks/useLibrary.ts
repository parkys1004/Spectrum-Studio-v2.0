import { useState, useEffect, useCallback, useRef } from 'react';
import { Track } from '../types';
import { storageService } from '../services/storageService';
import { audioService } from '../services/audioService';

// Helper to get duration
const getAudioDuration = (file: File): Promise<number> => {
    return new Promise((resolve) => {
        const url = URL.createObjectURL(file);
        const audio = new Audio(url);
        
        audio.onloadedmetadata = () => {
            const duration = audio.duration;
            URL.revokeObjectURL(url);
            resolve(Number.isFinite(duration) ? duration : 0);
        };

        audio.onerror = () => {
            URL.revokeObjectURL(url);
            resolve(0);
        };
    });
};

export const useLibrary = () => {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [selectedTrackIds, setSelectedTrackIds] = useState<Set<string>>(new Set());
  
  // Ref to track initialization status to prevent overwriting localStorage on mount
  const isInitialized = useRef(false);

  // Load Library on Mount
  useEffect(() => {
    const library = storageService.loadLibrary();
    if (library) {
      setTracks(library.tracks);
    }
    isInitialized.current = true;
  }, []);

  // Save Library on Changes
  useEffect(() => {
    // Only save if initialized. This allows saving empty arrays if the user deleted everything.
    if (isInitialized.current) {
        storageService.saveLibrary(tracks);
    }
  }, [tracks]);

  const handleFilesAdded = useCallback(async (files: FileList) => {
    const fileArray = Array.from(files);
    const newTracks: Track[] = [];

    // Process sequentially to keep order
    for (const file of fileArray) {
        const duration = await getAudioDuration(file);
        
        newTracks.push({
            id: crypto.randomUUID(),
            name: file.name.replace(/\.[^/.]+$/, ""),
            artist: 'Unknown',
            duration: duration,
            url: URL.createObjectURL(file),
            file,
        });
    }

    setTracks((prev) => [...prev, ...newTracks]);
    
    // Analyze Audio Mood in background
    for (const track of newTracks) {
        if (track.file) {
            storageService.saveFile(track.id, track.file);
            audioService.analyzeAudio(track.file as File).then((result) => {
                setTracks(prevTracks => prevTracks.map(t => {
                    if (t.id === track.id) {
                        return { ...t, mood: result.mood, moodColor: result.color };
                    }
                    return t;
                }));
            });
        }
    }
  }, []);

  // Reorder Tracks
  const handleReorderTrack = useCallback((sourceTrackId: string, targetTrackId: string) => {
    setTracks(prev => {
        const sourceIndex = prev.findIndex(t => t.id === sourceTrackId);
        const targetIndex = prev.findIndex(t => t.id === targetTrackId);
        
        if (sourceIndex === -1 || targetIndex === -1 || sourceIndex === targetIndex) return prev;

        // Create new array copy
        const newTracks = [...prev];
        // Remove source track
        const [movedTrack] = newTracks.splice(sourceIndex, 1);
        
        // Find index of target in the modified array to insert before it
        // Note: We search again because indices might have shifted
        const newTargetIndex = newTracks.findIndex(t => t.id === targetTrackId);
        
        // Insert at new position (placing before the target)
        newTracks.splice(newTargetIndex, 0, movedTrack);
        
        return newTracks;
    });
  }, []);

  // Duplicate Track
  const handleDuplicateTrack = useCallback(async (trackId: string) => {
      const trackToDuplicate = tracks.find(t => t.id === trackId);
      if (!trackToDuplicate) return;

      try {
          // 1. Get the file blob
          let file = trackToDuplicate.file;
          if (!file) {
              const blob = await storageService.getFile(trackId);
              if (blob) file = blob as File; 
          }
          
          if (!file) {
              alert("원본 파일을 찾을 수 없어 복사할 수 없습니다.");
              return;
          }

          // 2. Create new ID and Track Object
          const newId = crypto.randomUUID();
          const newTrack: Track = {
              ...trackToDuplicate,
              id: newId,
              name: `${trackToDuplicate.name} (Copy)`,
              file: file,
              duration: trackToDuplicate.duration, // Keep duration
              url: URL.createObjectURL(file) 
          };

          // 3. Save to Storage (IDB)
          await storageService.saveFile(newId, file);

          // 4. Update State (Insert after original)
          setTracks(prev => {
              const index = prev.findIndex(t => t.id === trackId);
              if (index === -1) return [...prev, newTrack];
              
              const newTracks = [...prev];
              newTracks.splice(index + 1, 0, newTrack);
              return newTracks;
          });

      } catch (e) {
          console.error("Duplicate failed", e);
          alert("트랙 복사 중 오류가 발생했습니다.");
      }
  }, [tracks]);

  const handleDeleteTrack = useCallback(async (trackId: string) => {
      try {
          // 1. Remove from Storage
          await storageService.deleteFile(trackId);
          
          // 2. Remove from State
          setTracks(prev => prev.filter(t => t.id !== trackId));

          // 3. Remove from Selection
          setSelectedTrackIds(prev => {
              const next = new Set(prev);
              next.delete(trackId);
              return next;
          });
          
          // 4. Clean up cache in audioService if it exists
          audioService.clearCache(trackId);
      } catch (e) {
          console.error("Failed to delete track:", e);
          alert("파일 삭제 중 오류가 발생했습니다.");
      }
  }, []);

  const handleDeleteSelectedTracks = useCallback(async () => {
      try {
          const idsToDelete = Array.from<string>(selectedTrackIds);
          
          // 1. Remove from Storage
          await Promise.all(idsToDelete.map(id => storageService.deleteFile(id)));
          
          // 2. Remove from State
          setTracks(prev => prev.filter(t => !selectedTrackIds.has(t.id)));

          // 3. Remove from Selection
          setSelectedTrackIds(new Set());
          
          // 4. Clean up cache in audioService
          idsToDelete.forEach(id => audioService.clearCache(id));
      } catch (e) {
          console.error("Failed to delete selected tracks:", e);
          alert("선택한 파일 삭제 중 오류가 발생했습니다.");
      }
  }, [selectedTrackIds]);

  const handleClearLibrary = useCallback(async () => {
      try {
          // 1. Clear Storage
          await storageService.clearAllFiles();
          
          // 2. Clear State
          setTracks([]);
          setSelectedTrackIds(new Set());
          
          // 3. Clear Cache
          audioService.clearCache();
          
      } catch (e) {
          console.error("Failed to clear library:", e);
          alert("라이브러리 초기화 중 오류가 발생했습니다.");
      }
  }, []);

  const toggleTrackSelection = useCallback((trackId: string) => {
      setSelectedTrackIds(prev => {
          const next = new Set(prev);
          if (next.has(trackId)) {
              next.delete(trackId);
          } else {
              next.add(trackId);
          }
          return next;
      });
  }, []);

  const toggleSelectAll = useCallback(() => {
      if (tracks.length === 0) return;
      setSelectedTrackIds(prev => {
          // If currently all selected, deselect all. Otherwise, select all.
          if (prev.size === tracks.length) {
              return new Set();
          } else {
              return new Set(tracks.map(t => t.id));
          }
      });
  }, [tracks]);

  return {
    tracks,
    setTracks,
    selectedTrackIds,
    handleFilesAdded,
    handleReorderTrack,
    handleDuplicateTrack,
    handleDeleteTrack,
    handleDeleteSelectedTracks,
    handleClearLibrary,
    toggleTrackSelection,
    toggleSelectAll
  };
};