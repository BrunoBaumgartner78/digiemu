"use client";
import { useRef } from "react";

type Props = {
  label: string;
  onChange: (file: File) => void;
};

export function FileSelect({ label, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

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
        onChange={(_e) => {
          const file = e.target.files?.[0];
          if (file) onChange(file);
        }}
      />
    </div>
  );
}
