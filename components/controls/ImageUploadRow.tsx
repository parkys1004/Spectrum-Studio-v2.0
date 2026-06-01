import React, { useRef } from "react";

interface ImageUploadRowProps {
  label: string;
  currentImage: string | null;
  onUpload: (file: File) => void;
  onRemove: () => void;
}

const ImageUploadRow: React.FC<ImageUploadRowProps> = ({
  label,
  currentImage,
  onUpload,
  onRemove,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex items-center py-3 px-4 select-none">
      <div className="w-20 text-xs text-app-textMuted font-bold uppercase tracking-wider truncate shrink-0">
        {label}
      </div>
      <div className="flex-1 mx-3 flex justify-end items-center space-x-2">
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/*,video/webm,video/mp4"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              onUpload(e.target.files[0]);
            }
          }}
        />
        {currentImage ? (
          <>
            <div className="px-3 py-1.5 rounded-lg bg-green-50 text-green-600 text-[11px] font-bold uppercase tracking-wider shadow-neu-pressed border border-green-100">
              적용됨
            </div>
            <button
              onClick={onRemove}
              className="w-8 h-8 flex items-center justify-center bg-app-bg text-red-400 shadow-neu-btn active:shadow-neu-pressed rounded-full transition-all hover:text-red-500"
              title="삭제"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
              >
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </>
        ) : (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 text-xs font-bold uppercase tracking-wide bg-app-bg text-app-textMuted shadow-neu-btn active:shadow-neu-pressed rounded-lg transition-all hover:text-app-accent"
          >
            파일 선택
          </button>
        )}
      </div>
    </div>
  );
};

export default ImageUploadRow;
