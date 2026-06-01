

// Singleton-ish service to manage AudioContext to avoid multiple contexts allowed by browser

class AudioService {
  private audioContext: AudioContext | null = null;
  private sourceNode: MediaElementAudioSourceNode | null = null;
  private gainNode: GainNode | null = null;
  private analyserNode: AnalyserNode | null = null;
  
  // EQ Nodes
  private bassFilter: BiquadFilterNode | null = null;
  private midFilter: BiquadFilterNode | null = null;
  private trebleFilter: BiquadFilterNode | null = null;
  
  private destNode: MediaStreamAudioDestinationNode | null = null; // Node for recording
  
  // Data buffer for analysis to prevent garbage collection issues
  private dataArray: Uint8Array | null = null;
  
  // Default buffer for idle state (1024 is half of default fftSize 2048)
  private defaultDataArray: Uint8Array = new Uint8Array(1024);

  // Cache decoded buffers by Track ID to prevent expensive re-decoding
  private bufferCache: Map<string, AudioBuffer> = new Map();
  
  // Reusable context for decoding to prevent hitting browser limits
  private decodeContext: OfflineAudioContext | null = null;

  init(audioElement: HTMLAudioElement) {
    if (this.audioContext) {
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
        return;
    }

    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    this.audioContext = new AudioContextClass();

    // Create Nodes
    this.sourceNode = this.audioContext.createMediaElementSource(audioElement);
    this.analyserNode = this.audioContext.createAnalyser();
    this.gainNode = this.audioContext.createGain();
    
    // Create Stream Destination for Recording
    this.destNode = this.audioContext.createMediaStreamDestination();
    
    // Equalizer Filters (Initialized but left at default neutral values)
    this.bassFilter = this.audioContext.createBiquadFilter();
    this.bassFilter.type = 'lowshelf';
    this.bassFilter.frequency.value = 250; 

    this.midFilter = this.audioContext.createBiquadFilter();
    this.midFilter.type = 'peaking';
    this.midFilter.Q.value = 1;
    this.midFilter.frequency.value = 1000;

    this.trebleFilter = this.audioContext.createBiquadFilter();
    this.trebleFilter.type = 'highshelf';
    this.trebleFilter.frequency.value = 4000;

    // Connect Graph: Source -> Bass -> Mid -> Treble -> Analyser -> Gain -> [Destination & StreamDest]
    this.sourceNode.connect(this.bassFilter);
    this.bassFilter.connect(this.midFilter);
    this.midFilter.connect(this.trebleFilter);
    this.trebleFilter.connect(this.analyserNode);
    this.analyserNode.connect(this.gainNode);
    
    // Connect Gain to both hardware speakers and recording stream
    this.gainNode.connect(this.audioContext.destination);
    this.gainNode.connect(this.destNode);

    // Default settings for Analyzer
    this.analyserNode.fftSize = 2048; // 2048 gives 1024 data points
    this.analyserNode.smoothingTimeConstant = 0.85; // Smooth out the bars for better visuals
    this.analyserNode.minDecibels = -90;
    this.analyserNode.maxDecibels = -10;

    this.gainNode.gain.value = 1.0;

    // Initialize buffer once
    const bufferLength = this.analyserNode.frequencyBinCount;
    this.dataArray = new Uint8Array(bufferLength);
  }

  resume() {
    if (this.audioContext?.state === 'suspended') {
      this.audioContext.resume().catch(err => console.error("Audio Context Resume Failed:", err));
    }
  }

  setSmoothingConstant(val: number) {
    if (this.analyserNode) {
        // Clamp between 0 and 1 (exclusive of 1 usually to avoid stall)
        const safeVal = Math.max(0.1, Math.min(0.99, val));
        this.analyserNode.smoothingTimeConstant = safeVal;
    }
  }

  // Logic: Extract Frequency Data (0-255 scale per bin)
  getFrequencyData(): Uint8Array {
    if (!this.analyserNode || !this.dataArray) {
      // Return zero-filled array so visualizer still runs (drawing flat lines/backgrounds)
      return this.defaultDataArray;
    }
    this.analyserNode.getByteFrequencyData(this.dataArray);
    return this.dataArray;
  }

  // Logic: Extract Waveform Data (0-255 scale, 128 is silence)
  getWaveformData(): Uint8Array {
    if (!this.analyserNode || !this.dataArray) {
       // Return 128-filled array (silence line)
       return this.defaultDataArray.map(() => 128);
    }
    this.analyserNode.getByteTimeDomainData(this.dataArray);
    return this.dataArray;
  }

  // New: Get full AudioBuffer for timeline visualization with Caching
  async getAudioBuffer(file: File | Blob, trackId: string): Promise<AudioBuffer | null> {
    // 1. Check Cache
    if (this.bufferCache.has(trackId)) {
        return this.bufferCache.get(trackId)!;
    }

    try {
        const arrayBuffer = await file.arrayBuffer();
        
        // 2. Decode using OfflineAudioContext (Better stability for batch processing)
        // Using a shared OfflineAudioContext avoids the "max number of AudioContexts" limit
        if (!this.decodeContext) {
            this.decodeContext = new OfflineAudioContext(1, 1, 48000);
        }
        
        // Wrap in a promise with a timeout to prevent infinite hangs
        const decodePromise = new Promise<AudioBuffer>((resolve, reject) => {
             this.decodeContext!.decodeAudioData(
                 arrayBuffer,
                 (buffer) => resolve(buffer),
                 (err) => reject(err)
             );
        });

        // 10-second timeout to prevent stalling
        const timeoutPromise = new Promise<never>((_, reject) => 
            setTimeout(() => reject(new Error("오디오 디코딩 시간 초과 (10초)")), 10000)
        );

        const audioBuffer = await Promise.race([decodePromise, timeoutPromise]);
        
        // 3. Save to Cache
        this.bufferCache.set(trackId, audioBuffer);
        
        return audioBuffer;
    } catch (e) {
        console.error("Failed to decode audio data", e);
        return null;
    }
  }

  // Clear cache if needed (e.g., memory warning or track deletion)
  clearCache(trackId?: string) {
      if (trackId) {
          this.bufferCache.delete(trackId);
      } else {
          this.bufferCache.clear();
      }
  }

  // New: Analyze full audio buffer to determine mood
    async analyzeAudio(file: File): Promise<{ mood: 'Chill' | 'Upbeat' | 'Powerful', color: string }> {
      try {
          const arrayBuffer = await file.arrayBuffer();
          
          if (!this.decodeContext) {
              this.decodeContext = new OfflineAudioContext(1, 1, 44100);
          }
          
          const audioBuffer = await new Promise<AudioBuffer>((resolve, reject) => {
               this.decodeContext!.decodeAudioData(arrayBuffer, resolve, reject);
          });
        
        // 2. Get Raw PCM Data (first 30 seconds to save performance)
        const rawData = audioBuffer.getChannelData(0); 
        const sampleRate = audioBuffer.sampleRate;
        const durationToAnalyze = Math.min(30, audioBuffer.duration);
        const samplesToAnalyze = Math.floor(sampleRate * durationToAnalyze);
        
        // 3. Calculate Energy (RMS) and Peak Density (BPM proxy)
        let sumSquares = 0;
        let peakCount = 0;
        const threshold = 0.5; // Amplitude threshold for a "beat"
        let isAboveThreshold = false;

        // Iterate with a step to increase performance
        const step = 100; 
        for (let i = 0; i < samplesToAnalyze; i += step) {
            const val = Math.abs(rawData[i]);
            sumSquares += val * val;

            // Simple peak detector
            if (val > threshold && !isAboveThreshold) {
                isAboveThreshold = true;
                peakCount++;
            } else if (val < threshold * 0.5) {
                isAboveThreshold = false;
            }
        }

        const rms = Math.sqrt(sumSquares / (samplesToAnalyze / step));
        const peaksPerSecond = peakCount / durationToAnalyze;

        if (rms > 0.15) {
             return { mood: 'Powerful', color: '#ef4444' }; // Red-500
        } else if (peaksPerSecond > 3) {
             return { mood: 'Upbeat', color: '#f59e0b' }; // Amber-500
        } else {
             return { mood: 'Chill', color: '#8b5cf6' }; // Violet-500 (or Blue)
        }

    } catch (e) {
        console.error("Analysis failed", e);
        // Fallback
        return { mood: 'Chill', color: '#3ea6ff' };
    }
  }

  getAudioStream(): MediaStream | null {
    return this.destNode ? this.destNode.stream : null;
  }
}

export const audioService = new AudioService();