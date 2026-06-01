
// This service is deprecated.
// High-Speed Offline Rendering (renderService.ts) is now used exclusively.

export class RecorderService {
  start() {
    console.warn("RecorderService is deprecated. Use RenderService for high-speed export.");
  }

  async stop(): Promise<{ url: string, filename: string }> {
    return { url: '', filename: '' };
  }
}

export const recorderService = new RecorderService();
