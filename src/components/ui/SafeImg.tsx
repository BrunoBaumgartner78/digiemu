"use client";
import * as React from "react";

export type SafeImgProps = Omit<
  React.ImgHTMLAttributes<HTMLImageElement>,
  "src"
> & {
  /** allow null/undefined from DB fields */
  src?: string | null;
  /** optional fallback src if src is null/empty or fails to load */
  fallbackSrc?: string;
  /** optional fallback node (e.g. <img ... /> or <div ... />) */
  fallback?: React.ReactNode;
};

export default function SafeImg({
  src,
  fallbackSrc = "/fallback-thumbnail.svg",
  fallback,
  alt,
  ...rest
}: SafeImgProps) {
  const initialSrc = (src ?? "").trim();
  const [currentSrc, setCurrentSrc] = React.useState<string>(
    initialSrc || fallbackSrc
  );
  const [failed, setFailed] = React.useState(false);

  React.useEffect(() => {
    const next = (src ?? "").trim();
    setFailed(false);
    setCurrentSrc(next || fallbackSrc);
  }, [src, fallbackSrc]);

  if (failed && fallback) return <>{fallback}</>;

  // eslint-disable-next-line @next/next/no-img-element
  return (
    <img
      {...rest}
      src={currentSrc}
      alt={alt ?? ""}
      onError={(e) => {
        // if we already tried fallbackSrc and it fails too, show fallback node (if provided)
        if (currentSrc === fallbackSrc) {
          setFailed(true);
          return;
        }
        setCurrentSrc(fallbackSrc);
        // keep original handler
        rest.onError?.(e);
      }}
    />
  );
}
