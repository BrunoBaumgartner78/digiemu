"use client";
export default function NeoInput({ className = "", ...props }) {
  return (
    <input
      {...props}
      className={`neo-inset w-full px-3 py-2 rounded-xl text-white bg-transparent ${className}`}
      style={{
        background: "var(--surface)",
        boxShadow: "var(--shadow-inset)",
        borderRadius: "var(--radius)"
      }}
    />
  );
}
