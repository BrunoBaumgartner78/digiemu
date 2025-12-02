import React from "react";

export function StatusBadge({ active }: { active: boolean }) {
  return (
    <span className={`px-2 py-1 rounded text-xs font-bold ${active ? "bg-green-600 text-white" : "bg-gray-600 text-white"}`}>
      {active ? "ACTIVE" : "INACTIVE"}
    </span>
  );
}
