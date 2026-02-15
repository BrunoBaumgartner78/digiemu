// src/components/ui/SafeImg.tsx
"use client";

import * as React from "react";
import Image from "next/image";

export type SafeImgProps = {
  src?: string | null;
  alt?: string | null;
  className?: string;
  style?: React.CSSProperties;

  /**
   * React fallback node (preferred)
   * e.g. <span>?</span> or <img .../>
   */
  fallback?: React.ReactNode;

  /**
   * Legacy convenience prop:
   * if provided and `fallback` is not set, we render an <img src={fallbackSrc} .../>
   */
  fallbackSrc?: string;

  /** default: true -> uses next/image only for local "/..." */
  preferNextImage?: boolean;

  /** default: true */
  fill?: boolean;

  sizes?: string;
  objectFit?: React.CSSProperties["objectFit"];
  loading?: "lazy" | "eager";
};

/**
 * SafeImg (hard-safe):
 * - Uses next/image ONLY for local paths ("/...").
 * - Remote URLs ALWAYS fall back to <img> to avoid runtime crashes
 *   when Next image host config isn't applied (preview/caches/etc).
 * - Supports legacy `fallbackSrc` prop.
 */
function isLocalNextImageSrc(url?: string | null) {
  if (!url) return false;
  const s = String(url).trim();
  return s.startsWith("/"); // only local
}

export default function SafeImg({
  src,
  alt,
  className,
  style,
  fallback,
  fallbackSrc,
  preferNextImage = true,
  fill = true,
  sizes,
  objectFit = "cover",
  loading = "lazy",
}: SafeImgProps) {
  const finalSrc = (src ?? "").trim();
  const finalAlt = alt ?? "";
  const [broken, setBroken] = React.useState(false);

  const hasSrc = finalSrc.length > 0;
  const useNext = preferNextImage && !broken && isLocalNextImageSrc(finalSrc);

  // wrapper must be relative for fill
  const wrapperStyle: React.CSSProperties = {
    position: "relative",
    display: "block",
    ...(style ?? {}),
  };

  const resolvedFallback =
    fallback ??
    (fallbackSrc ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={fallbackSrc}
        alt={finalAlt}
        loading={loading}
        style={{
          width: "100%",
          height: "100%",
          objectFit,
          display: "block",
        }}
      />
    ) : null);

  if (!hasSrc || broken) {
    return (
      <span className={className} style={wrapperStyle}>
        {resolvedFallback}
      </span>
    );
  }

  if (useNext) {
    return (
      <span className={className} style={wrapperStyle}>
        <Image
          src={finalSrc}
          alt={finalAlt}
          fill={fill}
          sizes={sizes}
          onError={() => setBroken(true)}
          style={{ objectFit }}
        />
      </span>
    );
  }

  // Remote: always <img> (never crashes because of next/image host rules)
  return (
    <span className={className} style={wrapperStyle}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={finalSrc}
        alt={finalAlt}
        loading={loading}
        onError={() => setBroken(true)}
        style={{
          position: fill ? "absolute" : "relative",
          inset: fill ? 0 : undefined,
          width: "100%",
          height: "100%",
          objectFit,
          display: "block",
        }}
      />
    </span>
  );
}
