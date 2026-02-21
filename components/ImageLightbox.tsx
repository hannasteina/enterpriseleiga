'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';

function getPlaceholderUrl(alt: string, width: number, height: number) {
  const text = encodeURIComponent(alt.split(' ').slice(0, 2).join(' '));
  return `https://placehold.co/${width}x${height}/1a1a2e/d4a843?text=${text}&font=raleway`;
}

interface ImageLightboxProps {
  src: string;
  alt: string;
  thumbnailClassName?: string;
  thumbnailWidth?: number;
  thumbnailHeight?: number;
}

export default function ImageLightbox({
  src,
  alt,
  thumbnailClassName = 'w-12 h-8 object-cover rounded',
  thumbnailWidth = 48,
  thumbnailHeight = 32,
}: ImageLightboxProps) {
  const [open, setOpen] = useState(false);
  const [imgError, setImgError] = useState(false);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, close]);

  const displaySrc = imgError ? getPlaceholderUrl(alt, thumbnailWidth * 4, thumbnailHeight * 4) : src;
  const fullSrc = imgError ? getPlaceholderUrl(alt, 800, 480) : src;

  return (
    <>
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(true); }}
        className="shrink-0 cursor-zoom-in hover:opacity-80 transition-opacity rounded overflow-hidden"
      >
        <Image
          src={displaySrc}
          alt={alt}
          width={thumbnailWidth}
          height={thumbnailHeight}
          className={thumbnailClassName}
          unoptimized
          onError={() => setImgError(true)}
        />
      </button>

      {open && (
        <div
          className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4"
          onClick={close}
        >
          <div
            className="relative max-w-3xl w-full animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={close}
              className="absolute -top-10 right-0 text-white/60 hover:text-white transition-colors text-sm flex items-center gap-1"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
              Loka
            </button>
            <Image
              src={fullSrc}
              alt={alt}
              width={800}
              height={480}
              className="w-full h-auto rounded-xl shadow-2xl"
              unoptimized
            />
            <p className="text-center text-white/60 text-sm mt-3">{alt}</p>
          </div>
        </div>
      )}
    </>
  );
}

export function CarPlaceholderIcon({ className = 'w-12 h-8' }: { className?: string }) {
  return (
    <div className={`${className} bg-white/5 rounded flex items-center justify-center`}>
      <svg className="w-5 h-3.5 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0H21M3.375 14.25h17.25M21 12.75V6.375a1.125 1.125 0 00-1.125-1.125H3.375A1.125 1.125 0 002.25 6.375v6.375" />
      </svg>
    </div>
  );
}
