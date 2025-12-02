

"use client";

import * as React from "react";

type LoadingButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  /**
   * Steuert den Ladezustand. Wird NICHT in den DOM weitergereicht.
   */
  loading?: boolean;
};

export function LoadingButton({
  loading = false,
  children,
  disabled,
  className = "",
  ...rest
}: LoadingButtonProps) {
  return (
    <button
      {...rest}
      disabled={loading || disabled}
      className={className}
    >
      {loading ? "Bitte warten..." : children}
    </button>
  );
}
