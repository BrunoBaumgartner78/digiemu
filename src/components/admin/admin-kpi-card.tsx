"use client";
import React from "react";

type AdminKpiCardProps = {
  title: string;
  value: string | number;
  hint?: string;
};

export default function AdminKpiCard({ title, value, hint }: AdminKpiCardProps) {
  return (
    <div className="rounded-xl bg-[#111] border border-[#333] p-4 shadow-md">
      <div className="text-sm text-gray-400">{title}</div>
      <div className="mt-2 text-2xl font-semibold text-white">{value}</div>
      {hint && <div className="mt-1 text-xs text-gray-500">{hint}</div>}
    </div>
  );
}
