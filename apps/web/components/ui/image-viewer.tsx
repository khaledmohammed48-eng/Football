'use client';

import { useEffect, useCallback } from 'react';

interface ImageViewerProps {
  src: string;
  alt: string;
  onClose: () => void;
}

export function ImageViewer({ src, alt, onClose }: ImageViewerProps) {
  const handleKey = useCallback(
    (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); },
    [onClose]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [handleKey]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.92)' }}
      onClick={onClose}
    >
      {/* Close button */}
      <button
        className="absolute top-4 left-4 text-white bg-white/10 hover:bg-white/20 rounded-full w-10 h-10 flex items-center justify-center text-xl transition z-10"
        onClick={onClose}
      >
        ×
      </button>

      {/* Image */}
      <div
        className="relative max-w-[90vw] max-h-[90vh] flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={src}
          alt={alt}
          className="max-w-[90vw] max-h-[90vh] object-contain rounded-xl shadow-2xl"
          style={{ userSelect: 'none' }}
        />
        {/* Caption */}
        <div className="absolute bottom-0 left-0 right-0 text-center text-white text-sm py-3 px-4 rounded-b-xl"
          style={{ background: 'linear-gradient(transparent, rgba(0,0,0,0.6))' }}>
          {alt}
        </div>
      </div>

      {/* ESC hint */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/40 text-xs">
        اضغط ESC أو انقر خارج الصورة للإغلاق
      </div>
    </div>
  );
}
