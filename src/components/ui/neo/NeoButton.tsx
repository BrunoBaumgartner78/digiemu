"use client";
import React from "react";

type NeoButtonProps = React.PropsWithChildren<React.ButtonHTMLAttributes<HTMLButtonElement>> & {
  className?: string;
};

export default function NeoButton({
  children,
  className = "",
  ...props
}: NeoButtonProps) {
  return (
    <button
      {...props}
      className={`neo text-white px-4 py-2 rounded-xl active:neo-inset transition ${className}`}
      style={{
        background: "var(--surface)",
        boxShadow: "var(--shadow-out)",
        borderRadius: "var(--radius)"
      }}
    >
      {children}
    </button>
  );
}
