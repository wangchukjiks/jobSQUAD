import React, { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ImageSliderProps {
  images: string[];
  alt: string;
  aspectClass?: string;
  emptyLabel?: string;
  activeIndex?: number;
  onIndexChange?: (idx: number) => void;
}

export function ImageSlider({
  images,
  alt,
  aspectClass = 'aspect-[16/10]',
  emptyLabel,
  activeIndex,
  onIndexChange,
}: ImageSliderProps) {
  const [internalIdx, setInternalIdx] = useState(0);
  const touchStartX = useRef<number | null>(null);

  const count = images.length;
  const controlled = typeof activeIndex === 'number';
  const currentIdx = count > 0 ? Math.min(controlled ? activeIndex : internalIdx, count - 1) : 0;

  useEffect(() => {
    if (!controlled && internalIdx >= count && count > 0) {
      setInternalIdx(0);
    }
  }, [count, controlled, internalIdx]);

  const setIndex = (next: number) => {
    if (count === 0) return;
    const wrapped = (next + count) % count;
    if (!controlled) {
      setInternalIdx(wrapped);
    }
    onIndexChange?.(wrapped);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (count <= 1) return;
    touchStartX.current = e.touches[0]?.clientX ?? null;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (count <= 1 || touchStartX.current === null) return;
    const endX = e.changedTouches[0]?.clientX ?? touchStartX.current;
    const diff = touchStartX.current - endX;
    if (Math.abs(diff) > 36) {
      setIndex(diff > 0 ? currentIdx + 1 : currentIdx - 1);
    }
    touchStartX.current = null;
  };

  if (count === 0) {
    return (
      <div className={`relative ${aspectClass} bg-[#0A1426] overflow-hidden flex items-center justify-center text-slate-500 text-sm px-4 text-center`}>
        {emptyLabel || alt}
      </div>
    );
  }

  return (
    <div
      className={`relative ${aspectClass} bg-[#081222] overflow-hidden select-none group`}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Slide Track */}
      <div
        className="flex w-full h-full transition-transform duration-300 ease-out"
        style={{ transform: `translateX(-${currentIdx * 100}%)` }}
      >
        {images.map((src, idx) => (
          <div key={idx} className="w-full h-full shrink-0">
            <img
              src={src}
              alt={`${alt} ${idx + 1}`}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          </div>
        ))}
      </div>

      {/* Multi-Image Controls */}
      {count > 1 && (
        <>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIndex(currentIdx - 1);
            }}
            aria-label="Previous image"
            className="absolute left-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/65 border border-white/15 text-white flex items-center justify-center hover:bg-[#D9A438] hover:text-[#071121] transition-colors cursor-pointer shadow-md"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIndex(currentIdx + 1);
            }}
            aria-label="Next image"
            className="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/65 border border-white/15 text-white flex items-center justify-center hover:bg-[#D9A438] hover:text-[#071121] transition-colors cursor-pointer shadow-md"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* Counter Badge */}
          <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded bg-black/65 border border-white/10 text-[11px] font-mono-num text-slate-100">
            {currentIdx + 1} / {count}
          </div>

          {/* Slide Dots */}
          <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/55 backdrop-blur-xs">
            {images.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIndex(idx);
                }}
                aria-label={`Slide ${idx + 1}`}
                className={`h-1.5 rounded-full transition-all cursor-pointer ${
                  idx === currentIdx ? 'w-4 bg-[#D9A438]' : 'w-1.5 bg-white/55 hover:bg-white'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
