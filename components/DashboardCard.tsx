"use client";

import React from "react";

interface DashboardCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  subtext?: string;
  trend?: "up" | "down" | "neutral";
  footer?: React.ReactNode;
}

export function DashboardCard({ title, value, icon, subtext, trend, footer }: DashboardCardProps) {
  return (
    <div className="rounded-xl border border-slate-700/50 bg-slate-800/40 p-5 backdrop-blur-sm transition-all hover:border-slate-600 hover:bg-slate-800/60">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{title}</p>
          <p className="mt-2.5 break-words text-xl font-bold leading-tight text-white sm:text-2xl">
            {value}
          </p>
          {subtext && <p className="mt-1 text-xs text-slate-500">{subtext}</p>}
        </div>
        {icon && <div className="shrink-0 text-2xl opacity-70">{icon}</div>}
      </div>
      {trend && (
        <div className="mt-4 flex items-center space-x-1 text-xs font-medium">
          <span
            className={
              trend === "up"
                ? "text-emerald-400"
                : trend === "down"
                  ? "text-rose-400"
                  : "text-slate-400"
            }
          >
            {trend === "up" ? "up" : trend === "down" ? "down" : "flat"}
          </span>
          <span className="text-slate-400">{trend}</span>
        </div>
      )}
      {footer && <div className="mt-4">{footer}</div>}
    </div>
  );
}
