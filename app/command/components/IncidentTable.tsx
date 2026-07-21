"use client";

import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Clock3, ExternalLink, RefreshCw } from "lucide-react";

import type { Incident, ThreatLevel } from "../../../lib/types";

interface IncidentTableProps {
  incidents: Incident[];
  isLoading: boolean;
  onRefresh: () => void;
}

type SortKey = "createdAt" | "threatScore" | "threatLevel" | "scamCategory" | "victimCity";

const levelOrder: Record<ThreatLevel, number> = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };

const levelStyles: Record<ThreatLevel, string> = {
  LOW: "border-emerald-400/20 bg-emerald-400/10 text-emerald-300",
  MEDIUM: "border-amber-400/20 bg-amber-400/10 text-amber-300",
  HIGH: "border-orange-400/20 bg-orange-400/10 text-orange-300",
  CRITICAL: "border-red-400/20 bg-red-400/10 text-red-300",
};

function titleCase(value: string): string {
  return value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

export default function IncidentTable({ incidents, isLoading, onRefresh }: IncidentTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>("createdAt");
  const [ascending, setAscending] = useState(false);

  function changeSort(nextKey: SortKey) {
    if (sortKey === nextKey) {
      setAscending((value) => !value);
      return;
    }
    setSortKey(nextKey);
    setAscending(nextKey !== "createdAt");
  }

  const sortedIncidents = useMemo(() => {
    return [...incidents].sort((a, b) => {
      let left: string | number = a[sortKey] as string | number;
      let right: string | number = b[sortKey] as string | number;
      if (sortKey === "threatLevel") {
        left = levelOrder[a.threatLevel];
        right = levelOrder[b.threatLevel];
      }
      if (sortKey === "createdAt") {
        left = new Date(a.createdAt).getTime();
        right = new Date(b.createdAt).getTime();
      }
      if (left < right) return ascending ? -1 : 1;
      if (left > right) return ascending ? 1 : -1;
      return 0;
    });
  }, [ascending, incidents, sortKey]);

  function SortButton({ label, value }: { label: string; value: SortKey }) {
    const active = sortKey === value;
    return (
      <button type="button" onClick={() => changeSort(value)} className="focus-ring inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.13em] text-slate-500 transition hover:text-white">
        {label}
        {active && (ascending ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />)}
      </button>
    );
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-xs text-slate-600">Select a column heading to sort incidents.</p>
        <button type="button" onClick={onRefresh} disabled={isLoading} className="focus-ring inline-flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs text-slate-500 transition hover:bg-white/5 hover:text-white disabled:opacity-50"><RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />Refresh list</button>
      </div>

      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 5 }).map((_, index) => <div key={index} className="h-14 animate-pulse rounded-xl bg-white/[0.04]" />)}</div>
      ) : sortedIncidents.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-10 text-center"><Clock3 className="mx-auto h-7 w-7 text-slate-600" /><p className="mt-3 text-sm text-slate-400">No incidents have been recorded yet.</p><p className="mt-1 text-xs text-slate-600">Analyze a message from the citizen portal to populate this table.</p></div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-white/10">
          <table className="w-full min-w-[850px] border-collapse text-left">
            <thead className="bg-white/[0.035]">
              <tr className="border-b border-white/10">
                <th className="px-4 py-3"><SortButton label="Incident" value="createdAt" /></th>
                <th className="px-4 py-3"><SortButton label="Threat" value="threatLevel" /></th>
                <th className="px-4 py-3"><SortButton label="Category" value="scamCategory" /></th>
                <th className="px-4 py-3"><SortButton label="Score" value="threatScore" /></th>
                <th className="px-4 py-3"><SortButton label="City" value="victimCity" /></th>
                <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.13em] text-slate-500">Identifiers</th>
                <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.13em] text-slate-500">Status</th>
              </tr>
            </thead>
            <tbody>
              {sortedIncidents.map((incident) => (
                <tr key={incident.id} className="border-b border-white/[0.07] last:border-0 hover:bg-white/[0.025]">
                  <td className="px-4 py-4"><p className="font-mono text-xs text-slate-300">{incident.id}</p><p className="mt-1 text-[11px] text-slate-600">{formatDate(incident.createdAt)}</p></td>
                  <td className="px-4 py-4"><span className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-semibold tracking-[0.12em] ${levelStyles[incident.threatLevel]}`}>{incident.threatLevel}</span></td>
                  <td className="px-4 py-4"><p className="text-xs font-medium text-slate-300">{titleCase(incident.scamCategory)}</p><p className="mt-1 text-[11px] uppercase text-slate-600">{incident.channel}</p></td>
                  <td className="px-4 py-4"><span className="text-lg font-semibold text-white">{incident.threatScore}</span><span className="text-xs text-slate-600"> / 100</span></td>
                  <td className="px-4 py-4 text-xs text-slate-400">{incident.victimCity ?? "Unknown"}</td>
                  <td className="max-w-52 px-4 py-4"><div className="space-y-1 text-[11px] text-slate-500">{incident.scammerPhone && <p className="truncate font-mono">{incident.scammerPhone}</p>}{incident.scammerUpi && <p className="truncate font-mono">{incident.scammerUpi}</p>}{!incident.scammerPhone && !incident.scammerUpi && <span>—</span>}</div></td>
                  <td className="px-4 py-4">{incident.complaintFiled ? <span className="inline-flex items-center gap-1.5 text-xs text-emerald-300"><ExternalLink className="h-3.5 w-3.5" />Filed</span> : <span className="text-xs text-slate-600">Open</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
