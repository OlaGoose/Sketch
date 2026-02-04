'use client';

import { useEffect } from 'react';

interface LoftModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  /** Optional max width (default: max-w-md) */
  maxWidth?: string;
}

export function LoftModal({
  open,
  onClose,
  title,
  children,
  maxWidth = 'max-w-md',
}: LoftModalProps) {
  useEffect(() => {
    if (!open) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'loft-modal-title' : undefined}
    >
      <div
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className={`relative w-full ${maxWidth} bg-white border-2 border-loft-black shadow-[8px_8px_0px_0px_#1A1A1A] p-6`}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <h2
            id="loft-modal-title"
            className="text-xl font-black uppercase tracking-wide text-loft-black mb-4"
          >
            {title}
          </h2>
        )}
        {children}
      </div>
    </div>
  );
}
