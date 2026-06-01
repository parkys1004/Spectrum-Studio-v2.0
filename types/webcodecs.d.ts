// --- VERCEL BUILD FIX START ---
// TypeScript compiler may fail if these types are not known in the build environment.
// We explicitly declare them here to bypass build errors.

declare class VideoFrame {
  constructor(
    image: CanvasImageSource,
    init?: { timestamp: number; duration?: number },
  );
  close(): void;
  readonly timestamp: number;
  readonly duration: number | null;
  readonly displayWidth: number;
  readonly displayHeight: number;
}

declare class VideoEncoder {
  constructor(init: {
    output: (chunk: any, meta: any) => void;
    error: (error: any) => void;
  });
  configure(config: {
    codec: string;
    width: number;
    height: number;
    bitrate?: number;
    framerate?: number;
    hardwareAcceleration?:
      | "no-preference"
      | "prefer-hardware"
      | "prefer-software";
    avc?: { format: string };
  }): void;
  encode(frame: VideoFrame, options?: { keyFrame: boolean }): void;
  flush(): Promise<void>;
  close(): void;
  readonly state: "configured" | "unconfigured" | "closed";
  readonly encodeQueueSize: number;
}

declare class AudioEncoder {
  constructor(init: {
    output: (chunk: any, meta: any) => void;
    error: (error: any) => void;
  });
  configure(config: {
    codec: string;
    sampleRate: number;
    numberOfChannels: number;
    bitrate?: number;
  }): void;
  encode(data: AudioData): void;
  flush(): Promise<void>;
  close(): void;
  readonly state: "configured" | "unconfigured" | "closed";
  readonly encodeQueueSize: number;
}

declare class AudioData {
  constructor(init: {
    format: string;
    sampleRate: number;
    numberOfFrames: number;
    numberOfChannels: number;
    timestamp: number;
    data: BufferSource;
  });
  close(): void;
  readonly duration: number;
}
// --- VERCEL BUILD FIX END ---

interface VideoEncoderWithState extends VideoEncoder {
  state: "configured" | "unconfigured" | "closed";
  encodeQueueSize: number;
}
