import React, { useState, useRef, useEffect } from "react";
import Playlist from "./components/Playlist";
import Visualizer from "./components/Visualizer";
import EffectControls from "./components/EffectControls";
import PlayerControls from "./components/PlayerControls";
import PresetPanel from "./components/PresetPanel";
import Modal from "./components/Modal";
import BentoBox from "./components/layout/BentoBox";
import { VisualizerMode, VisualizerSettings } from "./types";

import { Download, ExternalLink } from "lucide-react";
import { useLibrary } from "./hooks/useLibrary";
import { useAudioPlayer } from "./hooks/useAudioPlayer";
import { useExporter } from "./hooks/useExporter";
import { storageService } from "./services/storageService";

const DEFAULT_VISUALIZER_SETTINGS: VisualizerSettings = {
  color: "#8b5cf6", // Updated default to Violet to match theme
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
  resolution: "1080p",
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
    scanlines: false,
  },
  effectParams: {
    speed: 1.0,
    intensity: 1.0,
    shakeStrength: 1.0,
    glitchStrength: 1.0,
  },
};

const App: React.FC = () => {
  // 1. Library & Data State
  const {
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
    toggleSelectAll,
  } = useLibrary();

  // 2. Visualizer Settings State (Central Source of Truth)
  const [visualizerMode, setVisualizerMode] = useState<VisualizerMode | null>(
    VisualizerMode.MONSTERCAT,
  );

  // Initialize from storage or use defaults (Merging to ensure new props like roundness exist)
  const [visualizerSettings, setVisualizerSettings] =
    useState<VisualizerSettings>(() => {
      const saved = storageService.loadSettings();
      if (saved) {
        return { ...DEFAULT_VISUALIZER_SETTINGS, ...saved };
      }
      return DEFAULT_VISUALIZER_SETTINGS;
    });

  // Save settings whenever they change
  useEffect(() => {
    storageService.saveSettings(visualizerSettings);
  }, [visualizerSettings]);

  const visualizerCanvasRef = useRef<HTMLCanvasElement>(null);

  // UI State
  const [trackToDelete, setTrackToDelete] = useState<string | null>(null);
  const [showDeleteSelectedModal, setShowDeleteSelectedModal] = useState(false);
  const [showClearLibraryModal, setShowClearLibraryModal] = useState(false);
  const [showManualModal, setShowManualModal] = useState(false);

  // 3. Audio Player Logic
  const audioPlayer = useAudioPlayer(
    tracks,
    visualizerSettings,
    setVisualizerSettings,
    false,
  );

  // Filter tracks for export: if selection exists, use selection. Else use all.
  const tracksToExport =
    selectedTrackIds.size > 0
      ? tracks.filter((t) => selectedTrackIds.has(t.id))
      : tracks;

  const exporter = useExporter(
    tracksToExport,
    audioPlayer.currentTrack,
    audioPlayer.audioRef,
    audioPlayer.setIsPlaying,
    visualizerSettings,
    visualizerMode,
  );

  // Overwrite the simple boolean passed to hook with the real one for the UI blocking logic
  const isExporting = exporter.isExporting;

  // Timeline Generator
  const handleCopyTimeline = async () => {
    if (tracksToExport.length === 0) {
      alert("타임라인을 생성할 트랙이 없습니다.");
      return;
    }

    let currentSeconds = 0;
    let timelineText = "";

    for (const track of tracksToExport) {
      // Calculate Duration if missing (backward compatibility)
      let duration = track.duration;

      if (!duration || duration <= 0) {
        try {
          let file = track.file;
          if (!file) {
            const blob = await storageService.getFile(track.id);
            if (blob) file = blob as File;
          }
          if (file) {
            const tempAudio = new Audio(URL.createObjectURL(file));
            await new Promise((r) => {
              tempAudio.onloadedmetadata = () => {
                duration = tempAudio.duration;
                r(null);
              };
              tempAudio.onerror = () => {
                duration = 0;
                r(null);
              };
            });
          }
        } catch (e) {
          duration = 0;
        }
      }

      // Format: 00:00 - Title
      const hrs = Math.floor(currentSeconds / 3600);
      const mins = Math.floor((currentSeconds % 3600) / 60);
      const secs = Math.floor(currentSeconds % 60);

      let timestamp = "";
      if (hrs > 0) {
        timestamp = `${hrs}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
      } else {
        timestamp = `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
      }

      timelineText += `${timestamp} ${track.name}\n`;

      currentSeconds += duration || 0;
    }

    try {
      await navigator.clipboard.writeText(timelineText);
      alert("타임라인이 클립보드에 복사되었습니다!");
    } catch (err) {
      console.error("Failed to copy", err);
      alert("클립보드 복사에 실패했습니다.");
    }
  };

  return (
    <div className="min-h-screen bg-app-bg text-app-text font-sans selection:bg-app-accent selection:text-white flex flex-col h-screen overflow-hidden">
      {/* Export Modal */}
      <Modal
        isOpen={exporter.showExportModal}
        onClose={() => exporter.setShowExportModal(false)}
        onConfirm={exporter.startPlaylistExport}
        title="고속 미디어 내보내기"
        confirmText="렌더링 시작"
      >
        {/* Modal Content */}
        <div className="space-y-6">
          <div className="flex items-start space-x-4">
            <div className="p-3 bg-app-bg rounded-xl shadow-neu-flat text-app-accent">
              <svg
                className="w-8 h-8"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
            <div>
              <h4 className="font-bold text-xl text-app-text">
                대용량 고속 렌더링
              </h4>
              <p className="text-app-textMuted mt-1 leading-relaxed text-base">
                최신 브라우저 기술을 사용하여 대용량 영상도 안전하게 생성합니다.
                <br />
                <span className="text-app-accent font-bold">
                  '파일 직접 저장' 방식을 권장합니다. (0바이트 오류 방지)
                </span>
              </p>
            </div>
          </div>

          <div className="bg-app-bg p-4 rounded-xl shadow-neu-pressed text-sm text-app-text space-y-3">
            <div className="flex justify-between items-center border-b border-app-border pb-2 mb-1">
              <span className="font-semibold text-app-textMuted">
                대상 트랙
              </span>
              <span className="text-app-text font-bold text-base">
                {exporter.exportStats.total} 개
              </span>
            </div>

            <div className="space-y-2 pb-2">
              <span className="block mb-2 font-semibold text-app-textMuted">
                파일 형식
              </span>
              <label className="flex items-center space-x-3 cursor-pointer p-2 rounded-lg hover:shadow-neu-flat transition-all">
                <input
                  type="radio"
                  name="format"
                  value="mp4"
                  checked={exporter.exportFormat === "mp4"}
                  onChange={() => exporter.setExportFormat("mp4")}
                  className="text-app-accent focus:ring-app-accent w-5 h-5"
                />
                <span className="text-app-text font-medium">
                  MP4 (H.264 + AAC)
                </span>
                <span className="text-app-textMuted text-xs ml-auto">
                  호환성 우수
                </span>
              </label>
              <label className="flex items-center space-x-3 cursor-pointer p-2 rounded-lg hover:shadow-neu-flat transition-all">
                <input
                  type="radio"
                  name="format"
                  value="webm"
                  checked={exporter.exportFormat === "webm"}
                  onChange={() => exporter.setExportFormat("webm")}
                  className="text-app-accent focus:ring-app-accent w-5 h-5"
                />
                <span className="text-app-text font-medium">
                  WebM (VP9 + Opus)
                </span>
                <span className="text-app-textMuted text-xs ml-auto">
                  웹 최적화
                </span>
              </label>
            </div>
          </div>

          <p className="text-xs text-center text-app-textMuted mt-2">
            * 렌더링이 완료되면 자동으로 다운로드가 시작되거나 저장 위치를
            묻습니다.
          </p>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!trackToDelete}
        onClose={() => setTrackToDelete(null)}
        onConfirm={() => {
          if (trackToDelete) {
            handleDeleteTrack(trackToDelete);
            setTrackToDelete(null);
          }
        }}
        title="파일 삭제 확인"
        confirmText="삭제"
      >
        <div className="text-center py-2">
          <div className="w-16 h-16 bg-app-bg text-red-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-neu-btn">
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </div>
          <p className="text-lg font-bold text-app-text mb-2 px-4 truncate">
            '{tracks.find((t) => t.id === trackToDelete)?.name}'
          </p>
          <p className="text-app-textMuted leading-relaxed">
            정말 이 파일을 삭제하시겠습니까?
            <br />
            라이브러리 목록에서만 제거되며,{" "}
            <span className="text-app-text font-bold">
              원본 파일은 삭제되지 않습니다.
            </span>
            <br />
            <span className="text-xs text-red-400 mt-2 block font-bold tracking-wide">
              이 작업은 되돌릴 수 없습니다.
            </span>
          </p>
        </div>
      </Modal>

      {/* Delete Selected Confirmation Modal */}
      <Modal
        isOpen={showDeleteSelectedModal}
        onClose={() => setShowDeleteSelectedModal(false)}
        onConfirm={() => {
          handleDeleteSelectedTracks();
          setShowDeleteSelectedModal(false);
        }}
        title="선택한 파일 삭제"
        confirmText="삭제"
      >
        <div className="text-center py-2">
          <div className="w-16 h-16 bg-app-bg text-red-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-neu-btn">
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </div>
          <p className="text-lg font-bold text-app-text mb-2 px-4 truncate">
            선택한 {selectedTrackIds.size}개의 파일
          </p>
          <p className="text-app-textMuted leading-relaxed">
            정말 이 파일들을 삭제하시겠습니까?
            <br />
            라이브러리 목록에서만 제거되며,{" "}
            <span className="text-app-text font-bold">
              원본 파일은 삭제되지 않습니다.
            </span>
            <br />
            <span className="text-xs text-red-400 mt-2 block font-bold tracking-wide">
              이 작업은 되돌릴 수 없습니다.
            </span>
          </p>
        </div>
      </Modal>

      {/* Clear Library Confirmation Modal */}
      <Modal
        isOpen={showClearLibraryModal}
        onClose={() => setShowClearLibraryModal(false)}
        onConfirm={() => {
          handleClearLibrary();
          setShowClearLibraryModal(false);
        }}
        title="라이브러리 전체 초기화"
        confirmText="전체 삭제"
      >
        <div className="text-center py-2">
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-neu-pressed border-4 border-app-bg">
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              <line x1="10" y1="11" x2="10" y2="17"></line>
              <line x1="14" y1="11" x2="14" y2="17"></line>
            </svg>
          </div>
          <h3 className="text-xl font-bold text-app-text mb-3">
            모든 미디어를 삭제하시겠습니까?
          </h3>
          <p className="text-app-textMuted leading-relaxed text-sm">
            등록된 모든 음악 파일이 라이브러리에서 제거됩니다.
            <br />
            브라우저에 저장된 데이터만 삭제되며,{" "}
            <span className="text-app-text font-bold">
              컴퓨터의 원본 파일은 삭제되지 않습니다.
            </span>
            <br />
            <span className="text-red-500 font-bold text-xs mt-2 block">
              이 작업은 되돌릴 수 없습니다.
            </span>
          </p>
        </div>
      </Modal>

      {/* Manual Modal */}
      <Modal
        isOpen={showManualModal}
        onClose={() => setShowManualModal(false)}
        onConfirm={() => setShowManualModal(false)}
        title="사용 설명서 (MANUAL)"
        confirmText="닫기"
      >
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
          <section>
            <h4 className="font-bold text-app-accent mb-1 flex items-center">
              <span className="w-5 h-5 rounded-full bg-app-accent text-white text-xs flex items-center justify-center mr-2">
                1
              </span>
              음악 관리 및 순서 변경
            </h4>
            <p className="text-sm text-app-textMuted pl-7">
              '파일 가져오기'로 음악을 추가하세요. <br />
              <span className="text-app-text font-semibold">
                트랙을 드래그하여 재생 순서를 자유롭게 변경
              </span>
              할 수 있습니다. 체크박스를 선택하여 원하는 곡만 렌더링하거나
              삭제할 수 있습니다.
            </p>
          </section>
          <section>
            <h4 className="font-bold text-app-accent mb-1 flex items-center">
              <span className="w-5 h-5 rounded-full bg-app-accent text-white text-xs flex items-center justify-center mr-2">
                2
              </span>
              시각화 및 효과 설정
            </h4>
            <p className="text-sm text-app-textMuted pl-7">
              중앙 패널에서 시각화 모드를 선택하고, 우측 속성 패널에서 배경,
              로고, 특수 효과(눈, 비, 글리치 등)를 적용하여 나만의 영상을
              꾸며보세요.
            </p>
          </section>
          <section>
            <h4 className="font-bold text-app-accent mb-1 flex items-center">
              <span className="w-5 h-5 rounded-full bg-app-accent text-white text-xs flex items-center justify-center mr-2">
                3
              </span>
              선택적 렌더링 (내보내기)
            </h4>
            <p className="text-sm text-app-textMuted pl-7">
              원하는 트랙만 체크하여 '내보내기'를 누르면{" "}
              <span className="text-app-text font-semibold">
                선택된 곡들만 합쳐서 하나의 영상으로
              </span>{" "}
              만들어집니다. 선택이 없으면 전체 트랙이 렌더링됩니다.
            </p>
          </section>
          <section>
            <h4 className="font-bold text-app-accent mb-1 flex items-center">
              <span className="w-5 h-5 rounded-full bg-app-accent text-white text-xs flex items-center justify-center mr-2">
                4
              </span>
              타임라인 복사 (유튜브 챕터)
            </h4>
            <p className="text-sm text-app-textMuted pl-7">
              '타임라인 복사' 버튼을 클릭하면 현재 재생 목록의 시간 정보가
              클립보드에 복사됩니다. 유튜브 영상 설명에 붙여넣어 챕터 기능을
              바로 사용할 수 있습니다.
            </p>
          </section>
        </div>
      </Modal>

      {/* Main Grid Layout - Spaced for Neumorphism */}
      <div className="flex-1 p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 overflow-hidden">
        {/* Column 1: Playlist (2/12) */}
        <BentoBox
          className="col-span-1 lg:col-span-2 h-full order-1 animate-slideUp stagger-1 opacity-0"
          title="미디어"
        >
          <div
            className={`h-full ${isExporting ? "opacity-50 pointer-events-none" : ""}`}
          >
            <Playlist
              tracks={tracks}
              currentTrackId={audioPlayer.currentTrack?.id || null}
              selectedTrackIds={selectedTrackIds}
              onTrackSelect={audioPlayer.handleTrackSelect}
              onFilesAdded={handleFilesAdded}
              onReorderTrack={handleReorderTrack}
              onDuplicateTrack={handleDuplicateTrack}
              onDeleteTrack={setTrackToDelete}
              onDeleteSelectedTracks={() => setShowDeleteSelectedModal(true)}
              onClearLibrary={() => setShowClearLibraryModal(true)}
              onToggleSelection={toggleTrackSelection}
              onToggleSelectAll={toggleSelectAll}
              onCopyTimeline={handleCopyTimeline}
              onOpenManual={() => setShowManualModal(true)}
            />
          </div>
        </BentoBox>

        {/* Column 2: Presets & Effects (2/12) */}
        <BentoBox
          className="col-span-1 lg:col-span-2 h-full order-2 animate-slideUp stagger-2 opacity-0"
          title="프리셋 & 효과"
        >
          <div
            className={`h-full ${isExporting ? "opacity-50 pointer-events-none" : ""}`}
          >
            <PresetPanel
              currentMode={visualizerMode}
              onModeChange={setVisualizerMode}
              settings={visualizerSettings}
              onSettingsChange={setVisualizerSettings}
            />
          </div>
        </BentoBox>

        {/* Column 3: Visualizer + Timeline (5/12) */}
        <div className="col-span-1 lg:col-span-5 h-full flex flex-col gap-6 order-3 overflow-hidden">
          {/* Top: Visualizer */}
          <BentoBox
            className="flex-1 min-h-0 relative group animate-slideUp stagger-3 opacity-0"
            title={
              isExporting
                ? `렌더링 상태`
                : `프로그램: ${audioPlayer.currentTrack ? audioPlayer.currentTrack.name : "대기 중"}`
            }
            headerRight={
              <button
                onClick={
                  isExporting
                    ? exporter.cancelExport
                    : exporter.triggerExportModal
                }
                disabled={!audioPlayer.currentTrack && !isExporting}
                className={`flex items-center space-x-2.5 px-6 py-2.5 rounded-full text-sm font-extrabold uppercase transition-all tracking-wide ${
                  isExporting
                    ? "bg-red-50 text-red-500 shadow-neu-pressed animate-pulse"
                    : "bg-app-bg text-app-accent shadow-neu-btn hover:bg-app-accent hover:text-white active:shadow-neu-pressed"
                }`}
              >
                <div
                  className={`w-3 h-3 rounded-full shadow-sm ${isExporting ? "bg-red-500" : "bg-current"}`}
                ></div>
                <span>{isExporting ? "작업 취소" : "내보내기"}</span>
              </button>
            }
          >
            {/* Visualizer Content */}
            <Visualizer
              ref={visualizerCanvasRef}
              isPlaying={audioPlayer.isPlaying}
              mode={visualizerMode}
              settings={visualizerSettings}
            />

            {/* Export Overlay */}
            {isExporting && !exporter.downloadReady && (
              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-app-bg/80 pointer-events-none backdrop-blur-sm">
                <div className="w-[80%] max-w-[300px] flex flex-col items-center">
                  <div className="relative mb-8">
                    <div className="w-24 h-24 rounded-full shadow-neu-flat"></div>
                    <div className="w-24 h-24 rounded-full border-4 border-app-accent border-t-transparent animate-spin absolute top-0 left-0"></div>
                  </div>
                  <h3 className="text-2xl font-bold text-app-text mb-2 tracking-tight">
                    렌더링 진행 중
                  </h3>
                  <p className="text-base text-app-textMuted mb-8 text-center">
                    {exporter.exportStats.phase}
                  </p>

                  {exporter.exportStats.total > 0 && (
                    <div className="w-full h-4 bg-app-bg rounded-full shadow-neu-pressed overflow-hidden">
                      <div
                        className="bg-app-accent h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${(exporter.exportStats.current / exporter.exportStats.total) * 100}%`,
                        }}
                      ></div>
                    </div>
                  )}
                  <p className="mt-4 text-xs text-app-textMuted font-mono tracking-wider">
                    PROCESSING {exporter.exportStats.current} /{" "}
                    {exporter.exportStats.total}
                  </p>
                </div>
              </div>
            )}
          </BentoBox>

          {/* Bottom: Timeline (Fixed Height) */}
          <BentoBox
            className="h-[280px] shrink-0 animate-slideUp stagger-4 opacity-0"
            title={`타임라인: ${audioPlayer.currentTrack ? audioPlayer.currentTrack.name : "없음"}`}
          >
            <div
              className={`h-full ${isExporting ? "opacity-50 pointer-events-none" : ""}`}
            >
              <PlayerControls
                currentTrack={audioPlayer.currentTrack}
                isPlaying={audioPlayer.isPlaying}
                currentTime={audioPlayer.currentTime}
                duration={audioPlayer.duration}
                onPlayPause={audioPlayer.handlePlayPause}
                onSeek={audioPlayer.handleSeek}
                onNext={audioPlayer.handleNext}
                onPrev={audioPlayer.handlePrev}
                visualizerMode={visualizerMode}
                onModeChange={setVisualizerMode}
              />
            </div>
          </BentoBox>
        </div>

        {/* Column 4: Effect Controls (3/12) */}
        <BentoBox
          className="col-span-1 lg:col-span-3 h-full order-4 animate-slideUp stagger-4 opacity-0"
          title="속성 (Properties)"
        >
          <div
            className={`h-full overflow-y-auto ${isExporting ? "opacity-50 pointer-events-none" : ""}`}
          >
            <EffectControls
              visualizerSettings={visualizerSettings}
              onVisualizerChange={setVisualizerSettings}
            />
          </div>
        </BentoBox>
      </div>

      {/* Download Ready Modal */}
      {exporter.downloadReady && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-[90%] max-w-[500px] flex flex-col items-center bg-app-bg p-8 rounded-3xl shadow-2xl border border-app-border/10">
            <h3 className="text-2xl font-bold text-app-text mb-2 tracking-tight text-center">
              렌더링 완료!
            </h3>
            <p className="text-sm text-app-textMuted mb-6 text-center">
              비디오 파일이 성공적으로 생성되었습니다.<br/>
              아래 버튼을 누르거나 영상 우측 하단의 점 3개를 눌러 다운로드하세요.
            </p>
            
            <video 
              src={exporter.downloadReady.url} 
              controls 
              className="w-full rounded-xl mb-6 shadow-neu-pressed bg-black"
              style={{ maxHeight: '250px' }}
            />
            
            <div className="flex flex-col gap-3 w-full">
              <a
                href={exporter.downloadReady.url}
                download={exporter.downloadReady.filename}
                className="w-full py-3 bg-app-accent text-white rounded-xl font-bold text-lg shadow-neu-flat hover:shadow-neu-pressed transition-all text-center flex items-center justify-center gap-2"
              >
                <Download size={20} />
                파일 다운로드
              </a>
              <a
                href={exporter.downloadReady.url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 bg-app-surface text-app-text rounded-xl font-bold text-sm shadow-neu-flat hover:shadow-neu-pressed transition-all text-center flex items-center justify-center gap-2"
              >
                <ExternalLink size={16} />
                새 탭에서 열기 (다운로드 안될 시)
              </a>
              <button
                onClick={exporter.closeDownload}
                className="w-full py-3 bg-app-bg text-app-text rounded-xl font-medium shadow-neu-flat hover:shadow-neu-pressed transition-all mt-2"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
