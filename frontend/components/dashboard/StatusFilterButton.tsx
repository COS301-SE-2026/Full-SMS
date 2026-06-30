"use client";

import { StatusFilterButtonProps } from "@/types/dashboard";

export default function StatusFilterButton({
  label,
  value,
  currentFilter,
  onClick,
  count,
}: Readonly<StatusFilterButtonProps>) {
  const isActive = currentFilter === value;

  return (
    <button
      onClick={() => onClick(value)}
      className={`h-13 px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
        isActive
          ? "bg-primary/20 text-primary border border-primary/30"
          : "bg-card text-foreground/60 border border-border hover:bg-card/80 hover:text-foreground"
      }`}
    >
      {label}
      <span
        className={`text-xs px-1.5 py-0.5 rounded-full ${
          isActive ? "bg-primary/30" : "bg-border"
        }`}
      >
        {count}
      </span>
    </button>
  );
}
