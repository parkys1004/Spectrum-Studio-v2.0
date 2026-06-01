import { Track } from "../../types";
import { audioService } from "../audioService";
import { storageService } from "../storageService";

export const loadAudioBuffers = async (
  tracks: Track[],
  signal: AbortSignal,
  onProgress: (current: number, total: number, phase: string) => void
): Promise<{ validBuffers: AudioBuffer[]; totalDuration: number }> => {
  const decodedBuffers: (AudioBuffer | null)[] = new Array(tracks.length).fill(null);
  let totalDuration = 0;

  const BATCH_SIZE = 4; // Process 4 tracks at a time
  let processedCount = 0;

  onProgress(0, tracks.length, "오디오 리소스 분석 중...");

  for (let i = 0; i < tracks.length; i += BATCH_SIZE) {
    if (signal.aborted) throw new Error("Render Aborted");

    const batch = tracks.slice(i, i + BATCH_SIZE);
    const batchPromises = batch.map(async (track, batchIndex) => {
      const globalIndex = i + batchIndex;
      let fileToDecode = track.file;

      if (!fileToDecode) {
        try {
          const blob = await storageService.getFile(track.id);
          if (blob) fileToDecode = blob;
        } catch (e) {
          console.warn(`Failed to retrieve file for track ${track.id}`);
        }
      }

      if (fileToDecode) {
        try {
          const buffer = await audioService.getAudioBuffer(fileToDecode, track.id);
          if (buffer) {
            decodedBuffers[globalIndex] = buffer;
          }
        } catch (e) {
          console.error(`Error decoding track ${track.name}`, e);
        }
      }
    });

    await Promise.all(batchPromises);
    processedCount += batch.length;
    onProgress(
      Math.min(processedCount, tracks.length),
      tracks.length,
      `오디오 고속 디코딩 중 (${Math.min(processedCount, tracks.length)}/${tracks.length})...`,
    );
  }

  // Filter out failed decodes and calculate duration
  const validBuffers = decodedBuffers.filter((b): b is AudioBuffer => b !== null);
  totalDuration = validBuffers.reduce((acc, b) => acc + b.duration, 0);

  if (validBuffers.length === 0 || totalDuration === 0) {
    throw new Error("렌더링할 유효한 오디오 데이터가 없습니다.");
  }

  if (totalDuration > 43200) {
    throw new Error("총 재생 시간이 너무 깁니다. 12시간 이내로 트랙을 구성해주세요.");
  }

  return { validBuffers, totalDuration };
};
