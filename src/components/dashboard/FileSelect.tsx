"use client";
import { useRef } from "react";

export function FileSelect({ label, onChange }) {
  const inputRef = useRef(null);

  return (
    <div>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="px-4 py-2 rounded-full bg-white shadow"
      >
        {label}
      </button>
      <input
        type="file"
        ref={inputRef}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onChange(file);
        }}
      />
    </div>
  );
}
