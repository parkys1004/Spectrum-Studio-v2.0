export interface ImageDecodeResult {
  image: VideoFrame;
  complete: boolean;
}

export interface ImageDecoderInit {
  type: string;
  data: BufferSource;
}

export declare class ImageDecoder {
  constructor(init: ImageDecoderInit);
  decode(options: { frameIndex: number }): Promise<ImageDecodeResult>;
  close(): void;
  readonly tracks: {
    selectedTrack: {
      frameCount: number;
    } | null;
    ready: Promise<void>;
  };
  readonly complete: boolean;
}

export class GifController {
  private frames: { bitmap: ImageBitmap; duration: number }[] = [];
  private totalDuration: number = 0;
  private url: string = "";
  public isLoaded: boolean = false;
  private videoElement: HTMLVideoElement | null = null;
  private isVideo: boolean = false;

  async load(url: string) {
    if (this.url === url && this.isLoaded) return;
    this.dispose();
    this.url = url;

    try {
      // Check if it's a video (webm)
      if (url.startsWith("blob:")) {
        // We can't easily check the mime type of a blob URL synchronously,
        // but we can try to load it as a video first.
        // In a real app, you might pass the mime type down.
        // For now, we'll rely on the caller to handle webm correctly,
        // or we can just try to create a video element.
      }

      // A simple heuristic: if it's a webm, try video first
      // Since we are using object URLs from file inputs, we can't rely on extension.
      // We'll try to fetch the headers or just try video if it fails as image.

      const response = await fetch(url);
      const contentType = response.headers.get("content-type");

      if (contentType && contentType.includes("video")) {
        this.isVideo = true;
        this.videoElement = document.createElement("video");
        this.videoElement.src = url;
        this.videoElement.loop = true;
        this.videoElement.muted = true;
        this.videoElement.crossOrigin = "anonymous";
        this.videoElement.playsInline = true;

        await new Promise((resolve, reject) => {
          if (!this.videoElement) return reject();
          this.videoElement.onloadeddata = resolve;
          this.videoElement.onerror = reject;
          this.videoElement.load();
        });

        this.videoElement.play();
        this.isLoaded = true;
        return;
      }

      // Feature check
      if (typeof ImageDecoder === "undefined") {
        return; // Fallback to static image handled by caller
      }

      const data = await response.arrayBuffer();

      // Try decoding as GIF
      const decoder = new ImageDecoder({ type: "image/gif", data });

      await decoder.tracks.ready;
      const track = decoder.tracks.selectedTrack;

      if (!track || track.frameCount <= 1) {
        // Not an animated GIF or just one frame, let standard Image handle it for better performance
        decoder.close();
        return;
      }

      for (let i = 0; i < track.frameCount; i++) {
        const result = await decoder.decode({ frameIndex: i });
        const vf = result.image;

        // Duration in microseconds -> milliseconds (default 100ms)
        const duration = vf.duration ? vf.duration / 1000 : 100;

        const bitmap = await createImageBitmap(vf);
        vf.close();

        this.frames.push({ bitmap, duration });
      }

      decoder.close();

      this.totalDuration = this.frames.reduce((acc, f) => acc + f.duration, 0);
      this.isLoaded = true;
    } catch (e) {
      // Silent fail, caller will use static image
      // console.warn("GIF/Video Decoding skipped or failed", e);
    }
  }

  getFrame(timestampMs: number): CanvasImageSource | null {
    if (!this.isLoaded) return null;

    if (this.isVideo && this.videoElement) {
      return this.videoElement;
    }

    if (this.frames.length === 0) return null;

    const t = timestampMs % this.totalDuration;
    let acc = 0;
    for (const frame of this.frames) {
      if (t >= acc && t < acc + frame.duration) {
        return frame.bitmap;
      }
      acc += frame.duration;
    }
    return this.frames[0].bitmap;
  }

  async seekVideo(timestampMs: number): Promise<void> {
    if (!this.isVideo || !this.videoElement) return;
    
    // If duration is not available yet, default to a large number or just 1
    const duration = this.videoElement.duration && !isNaN(this.videoElement.duration) ? this.videoElement.duration : 1;
    const targetTime = (timestampMs / 1000) % duration;
    
    if (Math.abs(this.videoElement.currentTime - targetTime) < 0.01) {
      return;
    }

    return new Promise((resolve) => {
      const onSeeked = () => {
        this.videoElement!.removeEventListener('seeked', onSeeked);
        resolve();
      };
      this.videoElement!.addEventListener('seeked', onSeeked);
      this.videoElement!.currentTime = targetTime;
    });
  }

  dispose() {
    this.frames.forEach((f) => f.bitmap.close());
    this.frames = [];

    if (this.videoElement) {
      this.videoElement.pause();
      this.videoElement.removeAttribute("src");
      this.videoElement.load();
      this.videoElement = null;
    }

    this.isVideo = false;
    this.isLoaded = false;
    this.totalDuration = 0;
  }
}
