"use client";

import type { ButtonHTMLAttributes, PropsWithChildren } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  isLoading?: boolean;
};

export default function LoadingButton({
  isLoading,
  children,
  ...rest
}: PropsWithChildren<Props>) {
  return (
    <button
      {...rest}
      disabled={isLoading || rest.disabled}
      className="px-4 py-2 rounded-lg bg-black text-white disabled:opacity-50"
    >
      {isLoading ? "Saving…" : children}
    </button>
  );
}
