"use client";

import {
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  FileText,
  Quote,
  ShieldAlert,
} from "lucide-react";

import type { ScoredAnalysis, ThreatLevel } from "../../../lib/types";

interface ThreatCardProps {
  analysis: ScoredAnalysis;
  onGenerateComplaint: () => void;
}

const levelStyles: Record<ThreatLevel, { text: string; border: string; panel: string; bar: string }> = {
  LOW: { text: "text-emerald-300", border: "border-emerald-400/20", panel: "bg-emerald-400/[0.06]", bar: "from-emerald-500 to-green-400" },
  MEDIUM: { text: "text-amber-300", border: "border-amber-400/20", panel: "bg-amber-400/[0.06]", bar: "from-amber-500 to-yellow-300" },
  HIGH: { text: "text-orange-300", border: "border-orange-400/20", panel: "bg-orange-400/[0.06]", bar: "from-orange-500 to-amber-400" },
  CRITICAL: { text: "text-red-300", border: "border-red-400/20", panel: "bg-red-400/[0.06]", bar: "from-red-500 to-orange-400" },
};

const breakdownLabels: Array<{ key: keyof ScoredAnalysis["scoreBreakdown"]; label: string; max: number }> = [
  { key: "category", label: "Scam category", max: 30 },
  { key: "tactics", label: "Psychological tactics", max: 25 },
  { key: "signals", label: "Threat signals", max: 30 },
  { key: "blocklist", label: "Known identifier match", max: 25 },
];

function titleCase(value: string): string {
  return value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function severityClass(severity: string): string {
  if (severity === "critical") return "bg-red-400";
  if (severity === "high") return "bg-orange-400";
  if (severity === "medium") return "bg-amber-400";
  return "bg-blue-400";
}

export default function ThreatCard({ analysis, onGenerateComplaint }: ThreatCardProps) {
  const styles = levelStyles[analysis.threatLevel];
  const canFileComplaint = analysis.threatLevel === "HIGH" || analysis.threatLevel === "CRITICAL";

  return (
    <section className={`glass-panel overflow-hidden rounded-3xl border ${styles.border}`} aria-live="polite">
      <div className={`border-b ${styles.border} ${styles.panel} p-5 sm:p-6`}>
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
              <ShieldAlert className={`h-4 w-4 ${styles.text}`} />
              Analysis complete
            </div>
            <h2 className="mt-3 text-2xl font-semibold tracking-[-0.035em] text-white">{titleCase(analysis.scamCategory)}</h2>
            <p className="mt-1 text-sm text-slate-400">Detected language: {analysis.detectedLanguage} · Confidence: {Math.round(analysis.confidence * 100)}%</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Threat score</p>
              <p className={`mt-1 text-4xl font-semibold tracking-[-0.06em] ${styles.text}`}>{analysis.threatScore}<span className="text-lg text-slate-500">/100</span></p>
            </div>
            <div className={`flex h-16 w-16 items-center justify-center rounded-2xl border ${styles.border} ${styles.panel}`}>
              {analysis.threatLevel === "LOW" ? <CheckCircle2 className={`h-7 w-7 ${styles.text}`} /> : <AlertTriangle className={`h-7 w-7 ${styles.text}`} />}
            </div>
          </div>
        </div>

        <div className="mt-6">
          <div className="h-3 overflow-hidden rounded-full bg-black/20">
            <div className={`h-full rounded-full bg-gradient-to-r ${styles.bar} transition-[width] duration-1000 ease-out`} style={{ width: `${analysis.threatScore}%` }} />
          </div>
          <div className="mt-2 flex justify-between text-[11px] text-slate-500">
            <span>LOW</span>
            <span className={`font-semibold ${styles.text}`}>{analysis.threatLevel}</span>
            <span>CRITICAL</span>
          </div>
        </div>
      </div>

      <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[1fr_1.1fr]">
        <div>
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">Why this score?</h3>
            <span className="text-xs text-slate-600">Deterministic formula</span>
          </div>
          <div className="mt-4 space-y-4">
            {breakdownLabels.map((item) => {
              const value = analysis.scoreBreakdown[item.key];
              const width = Math.min(100, Math.round((value / item.max) * 100));
              return (
                <div key={item.key}>
                  <div className="mb-1.5 flex justify-between text-xs">
                    <span className="text-slate-400">{item.label}</span>
                    <span className="font-medium text-slate-200">+{value}</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                    <div className={`h-full rounded-full bg-gradient-to-r ${styles.bar} transition-[width] duration-700`} style={{ width: `${width}%` }} />
                  </div>
                </div>
              );
            })}
          </div>

          {analysis.blocklistMatches.length > 0 && (
            <div className="mt-5 rounded-2xl border border-red-400/15 bg-red-400/[0.05] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-red-300">Known identifier match</p>
              <div className="mt-3 space-y-2">
                {analysis.blocklistMatches.map((match) => (
                  <div key={`${match.entryType}-${match.value}`} className="flex items-center justify-between gap-3 text-xs">
                    <span className="font-mono text-slate-300">{match.value}</span>
                    <span className="text-red-200">{match.reportedCount ?? 1} reports</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div>
          <h3 className="text-sm font-semibold text-white">What we found</h3>
          <div className="mt-4 space-y-3">
            {analysis.threatSignals.length > 0 ? analysis.threatSignals.map((signal, index) => (
              <div key={`${signal.name}-${index}`} className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${severityClass(signal.severity)}`} />
                  <span className="text-xs font-semibold uppercase tracking-[0.13em] text-slate-300">{titleCase(signal.name)}</span>
                  <span className="ml-auto text-[10px] uppercase tracking-[0.16em] text-slate-600">{signal.severity}</span>
                </div>
                <div className="mt-3 flex gap-2 text-sm leading-6 text-slate-400">
                  <Quote className="mt-1 h-4 w-4 shrink-0 text-slate-600" />
                  <span>“{signal.quote}”</span>
                </div>
                {signal.explanation && <p className="mt-2 pl-6 text-xs leading-5 text-slate-500">{signal.explanation}</p>}
              </div>
            )) : (
              <div className="rounded-2xl border border-emerald-400/15 bg-emerald-400/[0.05] p-4 text-sm text-emerald-200">No strong scam signals were detected in the supplied material.</div>
            )}
          </div>
        </div>
      </div>

      {(analysis.transcript || analysis.documentType || analysis.forgeryIndicators?.length) && (
        <div className="border-t border-white/10 px-5 py-5 sm:px-6">
          {analysis.transcript && (
            <details className="group">
              <summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-semibold text-slate-200">
                <FileText className="h-4 w-4 text-violet-300" />
                View call transcript
                <ArrowUpRight className="ml-auto h-4 w-4 text-slate-600 transition group-open:rotate-90" />
              </summary>
              <pre className="mt-4 max-h-64 overflow-auto whitespace-pre-wrap rounded-2xl border border-white/10 bg-black/20 p-4 font-sans text-xs leading-6 text-slate-400">{analysis.transcript}</pre>
            </details>
          )}
          {analysis.documentType && <p className="text-sm text-slate-400">Document assessed: <span className="text-slate-200">{analysis.documentType}</span>{analysis.claimedAuthority ? ` · claims ${analysis.claimedAuthority}` : ""}</p>}
          {analysis.forgeryIndicators && analysis.forgeryIndicators.length > 0 && (
            <ul className="mt-3 space-y-2 text-xs text-slate-400">
              {analysis.forgeryIndicators.map((indicator) => <li key={indicator} className="flex gap-2"><span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-orange-400" />{indicator}</li>)}
            </ul>
          )}
        </div>
      )}

      <div className="border-t border-white/10 bg-white/[0.02] p-5 sm:p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-300">A calm next step</p>
            <p className="mt-2 text-sm leading-6 text-slate-300">{analysis.explanationForVictim}</p>
          </div>
          {canFileComplaint && (
            <button type="button" onClick={onGenerateComplaint} className="focus-ring button-secondary inline-flex shrink-0 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold">
              <FileText className="h-4 w-4" />
              Draft complaint
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
