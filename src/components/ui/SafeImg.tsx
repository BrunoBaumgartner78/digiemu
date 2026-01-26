"use client";
import React, { ImgHTMLAttributes, useState } from "react";
import Image from "next/image";

type SafeImgProps = Omit<ImgHTMLAttributes<HTMLImageElement>, "onError" | "src"> & {
  src?: string | null;
  fallbackSrc?: string | null;
  fallback?: React.ReactNode;
};

export default function SafeImg({ src, fallbackSrc, fallback, alt, className, style }: SafeImgProps) {
  const [currentSrc, setCurrentSrc] = useState<string | undefined>(src ?? undefined);
  const [triedFallback, setTriedFallback] = useState(false);
  const [failed, setFailed] = useState(false);

  if (!currentSrc && !fallbackSrc) {
    // no source at all -> render fallback node or empty span
    return <>{fallback ?? <span aria-hidden="true" className={className} style={style} />}</>;
  }

  const handleError = () => {
    if (fallbackSrc && !triedFallback) {
      setTriedFallback(true);
      setCurrentSrc(fallbackSrc ?? undefined);
      return;
    }
    setFailed(true);
  };

  if (failed) return <>{fallback ?? <span aria-hidden="true" className={className} style={style} />}</>;

  // Use next/image with `fill` to satisfy Next.js optimization and avoid `no-img-element` warnings
  return (
    <div className={className} style={{ position: "relative", display: "block", ...(style as React.CSSProperties) }}>
      <Image
        src={currentSrc as string}
        alt={alt ?? ""}
        fill
        sizes="(min-width:1024px) 25vw, 50vw"
        style={{ objectFit: (style as React.CSSProperties)?.objectFit ?? "cover" }}
        onError={handleError as unknown as () => void}
      />
    </div>
  );
}

