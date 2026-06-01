import React from 'react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    confirmText?: string;
    children?: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ 
    isOpen, 
    onClose, 
    onConfirm, 
    title, 
    confirmText = "확인",
    children 
}) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-app-bg/80 backdrop-blur-md animate-fadeIn">
            <div className="bg-app-bg w-[480px] shadow-neu-flat rounded-3xl flex flex-col overflow-hidden transform transition-all scale-100 p-2">
                
                {/* Header */}
                <div className="px-6 py-5 flex justify-between items-center border-b border-app-border/50">
                    <h3 className="text-base font-bold text-app-text tracking-wide uppercase">{title}</h3>
                    <button onClick={onClose} className="text-app-textMuted hover:text-app-accent transition-colors">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 text-base text-app-text bg-app-bg">
                    {children}
                </div>

                {/* Footer */}
                <div className="px-6 py-5 bg-app-bg flex justify-end space-x-4">
                    <button 
                        onClick={onClose}
                        className="px-6 py-2.5 text-sm font-bold text-app-textMuted hover:text-app-text bg-app-bg shadow-neu-btn active:shadow-neu-pressed rounded-xl transition-all"
                    >
                        취소
                    </button>
                    <button 
                        onClick={onConfirm}
                        className="px-6 py-2.5 text-sm font-bold text-white bg-app-accent hover:bg-violet-600 shadow-lg shadow-violet-500/30 rounded-xl transition-all transform hover:-translate-y-0.5 active:translate-y-0"
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Modal;