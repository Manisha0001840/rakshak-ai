"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  FileSearch,
  ImageIcon,
  Mic,
  MessageSquareText,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import AlertOverlay from "./components/AlertOverlay";
import AudioAnalyzer from "./components/AudioAnalyzer";
import ComplaintDraft from "./components/ComplaintDraft";
import FeedbackButtons from "./components/FeedbackButtons";
import ImageAnalyzer from "./components/ImageAnalyzer";
import TextAnalyzer from "./components/TextAnalyzer";
import ThreatCard from "./components/ThreatCard";
import type { ScoredAnalysis } from "../../lib/types";

type AnalysisTab = "text" | "audio" | "image";

const tabs: Array<{ id: AnalysisTab; label: string; description: string; icon: typeof MessageSquareText }> = [
  { id: "text", label: "Text message", description: "Paste a suspicious SMS, WhatsApp, or email", icon: MessageSquareText },
  { id: "audio", label: "Call recording", description: "Upload a recording of a suspicious call", icon: Mic },
  { id: "image", label: "Document or image", description: "Check a notice, warrant, or screenshot", icon: ImageIcon },
];

export default function CitizenPage() {
  const [activeTab, setActiveTab] = useState<AnalysisTab>("text");
  const [analysis, setAnalysis] = useState<ScoredAnalysis | null>(null);
  const [incidentId, setIncidentId] = useState<string | undefined>();
  const [isCriticalAlertOpen, setIsCriticalAlertOpen] = useState(false);
  const [isComplaintOpen, setIsComplaintOpen] = useState(false);

  function handleAnalysis(result: ScoredAnalysis, resultIncidentId?: string) {
    setAnalysis(result);
    setIncidentId(resultIncidentId);
    setIsCriticalAlertOpen(result.threatLevel === "CRITICAL");
  }

  function resetAnalysis() {
    setAnalysis(null);
    setIncidentId(undefined);
    setIsCriticalAlertOpen(false);
    setIsComplaintOpen(false);
  }

  return (
    <main className="min-h-screen px-4 pb-16 sm:px-6 lg:px-8">
      <header className="mx-auto flex w-full max-w-7xl items-center justify-between py-5">
        <Link href="/" className="focus-ring inline-flex items-center gap-3 rounded-xl">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-accent-gradient shadow-glow">
            <ShieldCheck className="h-5 w-5 text-white" />
          </span>
          <span>
            <span className="block text-sm font-semibold tracking-[0.22em] text-white">RAKSHAK AI</span>
            <span className="block text-[10px] uppercase tracking-[0.22em] text-slate-500">Citizen safety portal</span>
          </span>
        </Link>

        <div className="flex items-center gap-2 sm:gap-3">
          <Link href="/command" className="focus-ring hidden rounded-xl px-3 py-2 text-xs text-slate-400 transition hover:bg-white/5 hover:text-white sm:block">
            Command center
          </Link>
          <Link href="/" className="focus-ring inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-slate-300 transition hover:bg-white/[0.08]">
            <ArrowLeft className="h-3.5 w-3.5" />
            Home
          </Link>
        </div>
      </header>

      <section className="mx-auto w-full max-w-7xl pt-8 sm:pt-14">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-400/20 bg-blue-400/10 px-3 py-1.5 text-xs font-medium text-blue-200">
            <Sparkles className="h-3.5 w-3.5" />
            Private, evidence-aware analysis
          </div>
          <h1 className="mt-5 text-4xl font-semibold tracking-[-0.05em] text-white sm:text-5xl">Does this look suspicious?</h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-400 sm:text-base">
            Share the message, recording, or document that made you pause. Rakshak AI will explain the warning signs and help you choose a safe next step.
          </p>
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="min-w-0">
            <div className="grid gap-2 sm:grid-cols-3" role="tablist" aria-label="Analysis input type">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const selected = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={selected}
                    onClick={() => setActiveTab(tab.id)}
                    className={`focus-ring rounded-2xl border p-4 text-left transition ${
                      selected
                        ? "border-blue-400/35 bg-blue-400/10 shadow-glow"
                        : "border-white/10 bg-white/[0.035] hover:border-white/20 hover:bg-white/[0.06]"
                    }`}
                  >
                    <Icon className={`h-5 w-5 ${selected ? "text-blue-300" : "text-slate-500"}`} />
                    <span className="mt-3 block text-sm font-semibold text-white">{tab.label}</span>
                    <span className="mt-1 block text-xs leading-5 text-slate-500">{tab.description}</span>
                  </button>
                );
              })}
            </div>

            <div className="mt-4">
              {activeTab === "text" && <TextAnalyzer onAnalyzed={handleAnalysis} />}
              {activeTab === "audio" && <AudioAnalyzer onAnalyzed={handleAnalysis} />}
              {activeTab === "image" && <ImageAnalyzer onAnalyzed={handleAnalysis} />}
            </div>

            {analysis && (
              <div className="mt-6 space-y-4">
                <ThreatCard analysis={analysis} onGenerateComplaint={() => setIsComplaintOpen(true)} />
                <FeedbackButtons incidentId={incidentId} />
                <button type="button" onClick={resetAnalysis} className="focus-ring text-sm text-slate-500 transition hover:text-white">
                  Analyze something else
                </button>
              </div>
            )}
          </div>

          <aside className="space-y-4">
            <div className="glass-card rounded-3xl p-5">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-400/10 text-emerald-300">
                  <FileSearch className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-white">Before you share</p>
                  <p className="text-xs text-slate-500">A few safety reminders</p>
                </div>
              </div>
              <ul className="mt-5 space-y-3 text-xs leading-5 text-slate-400">
                <li className="flex gap-2"><span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />Do not reply, click links, or transfer money while checking.</li>
                <li className="flex gap-2"><span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />Keep the original message or recording for evidence.</li>
                <li className="flex gap-2"><span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />You can hide personal details before sharing when possible.</li>
              </ul>
            </div>
            <div className="rounded-3xl border border-red-400/15 bg-red-400/[0.06] p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-red-300">Immediate financial fraud</p>
              <p className="mt-3 text-sm leading-6 text-slate-300">If you already transferred money, call <strong className="text-white">1930</strong> immediately and contact your bank through its official number.</p>
            </div>
          </aside>
        </div>
      </section>

      <AlertOverlay open={isCriticalAlertOpen} analysis={analysis} onClose={() => setIsCriticalAlertOpen(false)} />
      {analysis && (
        <ComplaintDraft
          open={isComplaintOpen}
          analysis={analysis}
          incidentId={incidentId}
          onClose={() => setIsComplaintOpen(false)}
        />
      )}
    </main>
  );
}
