"use client";

import { useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface ImageCarouselProps {
  images: string[];
  alt: string;
  /** Tailwind class for the wrapping <img> element (controls sizing/object-fit). */
  imgClassName?: string;
  /** Tailwind class for the carousel root container. */
  className?: string;
  /** Show the dot/pip indicator at the bottom. Default true. */
  showIndicators?: boolean;
  /** Show prev/next chevron buttons on hover. Default true. */
  showArrows?: boolean;
  /** Rounded corners class. Default "rounded-xl". */
  rounded?: string;
  /** Optional aspect-ratio class. Default "aspect-[4/3]". */
  aspect?: string;
}

export function ImageCarousel({
  images,
  alt,
  imgClassName = "object-cover w-full h-full",
  className = "",
  showIndicators = true,
  showArrows = true,
  rounded = "rounded-xl",
  aspect = "aspect-[4/3]",
}: ImageCarouselProps) {
  const safeImages = images && images.length > 0 ? images : [];
  const [activeIndex, setActiveIndex] = useState(0);
  const hasMultiple = safeImages.length > 1;

  const goPrev = useCallback(() => {
    setActiveIndex((i) => (i - 1 + safeImages.length) % safeImages.length);
  }, [safeImages.length]);

  const goNext = useCallback(() => {
    setActiveIndex((i) => (i + 1) % safeImages.length);
  }, [safeImages.length]);

  if (safeImages.length === 0) return null;

  return (
    <div className={cn("relative group overflow-hidden", rounded, aspect, className)}>
      {/* Slide images — all rendered, current one is opaque, others are absolute-positioned and hidden */}
      {safeImages.map((src, i) => (
        <img
          key={src + i}
          src={src}
          alt={`${alt} — image ${i + 1} of ${safeImages.length}`}
          loading={i === 0 ? "eager" : "lazy"}
          className={cn(
            "absolute inset-0 transition-opacity duration-300",
            i === activeIndex ? "opacity-100" : "opacity-0 pointer-events-none",
            imgClassName
          )}
        />
      ))}

      {/* Prev / Next arrows — only when more than one image */}
      {showArrows && hasMultiple && (
        <>
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); goPrev(); }}
            aria-label="Previous image"
            className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); goNext(); }}
            aria-label="Next image"
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </>
      )}

      {/* Indicator dots / counter */}
      {showIndicators && hasMultiple && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
          {safeImages.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setActiveIndex(i); }}
              aria-label={`Go to image ${i + 1}`}
              className={cn(
                "h-1.5 rounded-full transition-all",
                i === activeIndex ? "w-5 bg-white" : "w-1.5 bg-white/50 hover:bg-white/80"
              )}
            />
          ))}
        </div>
      )}

      {/* Image counter pill */}
      {hasMultiple && (
        <div className="absolute top-2 right-2 px-2 py-0.5 bg-black/50 backdrop-blur-sm rounded-full text-white text-[10px] font-medium tabular-nums">
          {activeIndex + 1} / {safeImages.length}
        </div>
      )}
    </div>
  );
}

export default ImageCarousel;
