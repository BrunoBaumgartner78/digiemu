"use client";
import React, { ImgHTMLAttributes, useState } from "react";

type SafeImgProps = Omit<ImgHTMLAttributes<HTMLImageElement>, "onError" | "src"> & {
  src?: string | null;
  fallbackSrc?: string | null;
  fallback?: React.ReactNode;
};

export default function SafeImg({ src, fallbackSrc, fallback, alt, className, style, ...rest }: SafeImgProps) {
  const [currentSrc, setCurrentSrc] = useState<string | undefined>(src ?? undefined);
  const [triedFallback, setTriedFallback] = useState(false);
  const [failed, setFailed] = useState(false);

  if (!currentSrc && !fallbackSrc) {
    // no source at all -> render fallback node or empty span
    return <>{fallback ?? <span aria-hidden="true" className={className} style={style} />}</>;
  }

  const handleError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    if (fallbackSrc && !triedFallback) {
      setTriedFallback(true);
      setCurrentSrc(fallbackSrc ?? undefined);
      return;
    }
    setFailed(true);
  };

  if (failed) return <>{fallback ?? <span aria-hidden="true" className={className} style={style} />}</>;

  return (
    <img
      src={currentSrc}
      alt={alt}
      className={className}
      style={style}
      onError={handleError}
      {...rest}
    />
  );
}
