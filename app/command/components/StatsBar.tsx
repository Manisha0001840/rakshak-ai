"use client";

import { Activity, AlertOctagon, FileCheck2, Gauge, ShieldAlert } from "lucide-react";

import type { DashboardStats } from "../../../lib/types";

interface StatsBarProps {
  stats: DashboardStats;
  isLoading: boolean;
}

const cards = [
  { key: "totalIncidents", label: "Total incidents", icon: Activity, color: "text-blue-300", panel: "bg-blue-400/[0.07]" },
  { key: "criticalToday", label: "Critical today", icon: AlertOctagon, color: "text-red-300", panel: "bg-red-400/[0.07]" },
  { key: "highRiskOpen", label: "High-risk open", icon: ShieldAlert, color: "text-orange-300", panel: "bg-orange-400/[0.07]" },
  { key: "complaintsFiled", label: "Complaints filed", icon: FileCheck2, color: "text-emerald-300", panel: "bg-emerald-400/[0.07]" },
  { key: "averageThreatScore", label: "Average threat", icon: Gauge, color: "text-violet-300", panel: "bg-violet-400/[0.07]" },
] as const;

export default function StatsBar({ stats, isLoading }: StatsBarProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      {cards.map((card) => {
        const Icon = card.icon;
        const value = stats[card.key];
        return (
          <div key={card.key} className="glass-card rounded-2xl p-4">
            <div className="flex items-center justify-between gap-3">
              <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${card.panel} ${card.color}`}><Icon className="h-4 w-4" /></span>
              <span className="text-[10px] uppercase tracking-[0.17em] text-slate-600">Live</span>
            </div>
            <p className="mt-5 text-xs text-slate-500">{card.label}</p>
            {isLoading ? <div className="mt-2 h-8 w-20 animate-pulse rounded-lg bg-white/10" /> : <p className={`mt-1 text-3xl font-semibold tracking-[-0.05em] ${card.color}`}>{value.toLocaleString("en-IN")}</p>}
          </div>
        );
      })}
    </div>
  );
}
