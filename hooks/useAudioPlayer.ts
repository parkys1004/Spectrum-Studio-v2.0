import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Track, VisualizerSettings } from '../types';
import { audioService } from '../services/audioService';
import { storageService } from '../services/storageService';

export const useAudioPlayer = (
    tracks: Track[], 
    visualizerSettings: VisualizerSettings,
    setVisualizerSettings: React.Dispatch<React.SetStateAction<VisualizerSettings>>,
    isExporting: boolean
) => {
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  
  const audioRef = useRef<HTMLAudioElement>(new Audio());

  // Audio Event Listeners
  useEffect(() => {
    const audio = audioRef.current;
    
    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onDurationChange = () => setDuration(audio.duration);
    const onEnded = () => handleNext();
    
    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onDurationChange);
    audio.addEventListener('ended', onEnded);
    audio.volume = 0.8;

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onDurationChange);
      audio.removeEventListener('ended', onEnded);
    };
  }, [tracks, currentTrack]); // Re-bind when tracks/currentTrack changes to ensure handleNext has fresh closure

  // Sync Smoothing
  useEffect(() => {
    audioService.setSmoothingConstant(visualizerSettings.sensitivity);
  }, [visualizerSettings.sensitivity]);

  const handleTrackSelect = async (track: Track, autoPlay: boolean = true) => {
    let activeTrack = tracks.find(t => t.id === track.id) || track;
    
    if (!activeTrack.url || activeTrack.url === '') {
        const blob = await storageService.getFile(activeTrack.id);
        if (blob) {
            const newUrl = URL.createObjectURL(blob);
            activeTrack = { ...activeTrack, url: newUrl, file: blob };
            // Note: We don't update tracks state here directly as it's complex to pass setter back.
            // The main app usually handles track updates via useLibrary, or we assume ephemeral URL is enough.
        } else {
            console.error("Audio file not found in storage");
            return;
        }
    }

    const audio = audioRef.current;
    
    audioService.init(audio);
    audioService.resume();
    audioService.setSmoothingConstant(visualizerSettings.sensitivity);

    // REMOVED: Automatic mood color override. 
    // This allows the user's manually set theme color (persisted in localStorage) to remain active.
    // if (activeTrack.moodColor && !isExporting) {
    //    setVisualizerSettings(prev => ({ ...prev, color: activeTrack.moodColor! }));
    // }

    setCurrentTrack(activeTrack);
    
    audio.pause();
    audio.src = activeTrack.url;
    
    if (autoPlay) {
        try {
            await audio.play();
            setIsPlaying(true);
        } catch (e) {
            if ((e as Error).name !== 'AbortError') {
                console.error(e);
            }
        }
    }
  };

  const handlePlayPause = () => {
    if (isExporting) return;

    const audio = audioRef.current;
    if (!currentTrack) return;
    
    audioService.init(audio);
    audioService.resume();

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play().catch(e => console.error(e));
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (time: number) => {
    if (isExporting) return;
    const audio = audioRef.current;
    if (!Number.isFinite(time)) return;
    audio.currentTime = time;
    setCurrentTime(time);
  };

  const handleNext = useCallback(async () => {
    if (!currentTrack || tracks.length === 0) return;
    
    const currentIndex = tracks.findIndex(t => t.id === currentTrack.id);
    
    if (currentIndex !== -1) {
        const nextIndex = (currentIndex + 1) % tracks.length;
        handleTrackSelect(tracks[nextIndex], true);
    }
  }, [currentTrack, tracks]);

  const handlePrev = useCallback(() => {
    if (isExporting) return;
    if (!currentTrack || tracks.length === 0) return;
    
    const currentIndex = tracks.findIndex(t => t.id === currentTrack.id);
    if (currentIndex !== -1) {
        const prevIndex = (currentIndex - 1 + tracks.length) % tracks.length;
        handleTrackSelect(tracks[prevIndex]);
    }
  }, [currentTrack, tracks, isExporting]);

  return {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    audioRef,
    setIsPlaying, // Export logic needs to force pause
    handleTrackSelect,
    handlePlayPause,
    handleSeek,
    handleNext,
    handlePrev
  };
};