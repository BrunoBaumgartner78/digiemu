"use client";
import React from "react";
import './styles/NeoCard.module.css';

type NeoCardProps = React.PropsWithChildren<React.HTMLAttributes<HTMLDivElement>> & {
  className?: string;
};

export default function NeoCard({ children, className = "", ...props }: NeoCardProps) {
  return (
    <div
      {...props}
      className={`neo p-4 rounded-xl shadow-lg ${className}`}
      style={{
        background: "var(--surface)",
        boxShadow: "var(--shadow-out)",
        borderRadius: "var(--radius)"
      }}
    >
      {children}
    </div>
  );
}
