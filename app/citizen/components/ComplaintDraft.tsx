"use client";

import { useEffect, useState } from "react";
import { Check, Clipboard, Download, FileText, Loader2, X } from "lucide-react";

import type { ComplaintDraft as ComplaintDraftType, ScoredAnalysis } from "../../../lib/types";

interface ComplaintDraftProps {
  open: boolean;
  analysis: ScoredAnalysis;
  incidentId?: string;
  onClose: () => void;
}

export default function ComplaintDraft({ open, analysis, incidentId, onClose }: ComplaintDraftProps) {
  const [draft, setDraft] = useState<ComplaintDraftType | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (open && !draft && !isLoading && !error) {
      void generateDraft();
    }
    // The modal should generate one draft for the current analysis when opened.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  async function generateDraft() {
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/complaint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ incidentId, analysis }),
      });
      const payload = (await response.json()) as { data?: { complaint?: ComplaintDraftType }; error?: string };

      if (!response.ok || !payload.data?.complaint) {
        throw new Error(payload.error || "The complaint draft could not be generated.");
      }

      setDraft(payload.data.complaint);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to generate the complaint draft.");
    } finally {
      setIsLoading(false);
    }
  }

  function closeModal() {
    setDraft(null);
    setError("");
    setCopied(false);
    onClose();
  }

  function draftText(): string {
    if (!draft) return "";
    return [
      `Subject: ${draft.subject}`,
      "",
      draft.complaintText,
      "",
      "Applicable sections for review:",
      ...draft.applicableSections.map((item) => `- ${item}`),
      "",
      "Filing instructions:",
      ...draft.filingInstructions.map((item) => `- ${item}`),
      "",
      "Additional steps:",
      ...draft.additionalSteps.map((item) => `- ${item}`),
    ].join("\n");
  }

  async function copyDraft() {
    await navigator.clipboard.writeText(draftText());
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  function downloadDraft() {
    const blob = new Blob([draftText()], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `rakshak-complaint-${incidentId ?? "draft"}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center overflow-y-auto bg-black/75 p-4 backdrop-blur-md sm:p-6" role="dialog" aria-modal="true" aria-labelledby="complaint-draft-title">
      <div className="glass-panel relative max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-[2rem]">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/10 bg-[#11111a]/90 px-5 py-4 backdrop-blur-xl sm:px-7">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-400/10 text-blue-300"><FileText className="h-5 w-5" /></span>
            <div>
              <h2 id="complaint-draft-title" className="text-base font-semibold text-white">NCRP complaint draft</h2>
              <p className="text-xs text-slate-500">Review every detail before filing</p>
            </div>
          </div>
          <button type="button" onClick={closeModal} className="focus-ring rounded-xl p-2 text-slate-500 transition hover:bg-white/10 hover:text-white" aria-label="Close complaint draft"><X className="h-5 w-5" /></button>
        </div>

        <div className="p-5 sm:p-7">
          {isLoading && (
            <div className="flex min-h-72 flex-col items-center justify-center text-center">
              <Loader2 className="h-8 w-8 animate-spin text-blue-300" />
              <p className="mt-4 text-sm font-medium text-slate-200">Preparing an evidence-grounded draft...</p>
              <p className="mt-2 max-w-sm text-xs leading-5 text-slate-500">This may take a few seconds. The draft will not be submitted automatically.</p>
            </div>
          )}

          {error && !isLoading && (
            <div className="rounded-2xl border border-red-400/20 bg-red-400/[0.07] p-5">
              <p className="text-sm text-red-200">{error}</p>
              <button type="button" onClick={() => void generateDraft()} className="focus-ring mt-4 rounded-lg border border-red-300/25 px-3 py-2 text-xs font-medium text-red-100 hover:bg-red-400/10">Try again</button>
            </div>
          )}

          {draft && !isLoading && (
            <div className="space-y-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.17em] text-slate-500">Subject</p>
                <p className="mt-2 rounded-xl border border-white/10 bg-white/[0.035] p-4 text-sm font-medium text-white">{draft.subject}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.17em] text-slate-500">Complaint description</p>
                <p className="mt-2 whitespace-pre-wrap rounded-xl border border-white/10 bg-white/[0.035] p-4 text-sm leading-7 text-slate-300">{draft.complaintText}</p>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <section className="rounded-2xl border border-white/10 bg-white/[0.025] p-4">
                  <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-300">Sections for review</h3>
                  <ul className="mt-3 space-y-2 text-xs leading-5 text-slate-400">{draft.applicableSections.map((item) => <li key={item}>• {item}</li>)}</ul>
                </section>
                <section className="rounded-2xl border border-white/10 bg-white/[0.025] p-4">
                  <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-violet-300">Filing instructions</h3>
                  <ul className="mt-3 space-y-2 text-xs leading-5 text-slate-400">{draft.filingInstructions.map((item) => <li key={item}>• {item}</li>)}</ul>
                </section>
                <section className="rounded-2xl border border-white/10 bg-white/[0.025] p-4">
                  <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-300">Additional steps</h3>
                  <ul className="mt-3 space-y-2 text-xs leading-5 text-slate-400">{draft.additionalSteps.map((item) => <li key={item}>• {item}</li>)}</ul>
                </section>
              </div>
              <div className="flex flex-col gap-3 border-t border-white/10 pt-5 sm:flex-row sm:justify-end">
                <button type="button" onClick={copyDraft} className="focus-ring button-secondary inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold">
                  {copied ? <Check className="h-4 w-4 text-emerald-300" /> : <Clipboard className="h-4 w-4" />}
                  {copied ? "Copied" : "Copy draft"}
                </button>
                <button type="button" onClick={downloadDraft} className="focus-ring button-primary inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold"><Download className="h-4 w-4" />Download text</button>
              </div>
              <p className="text-center text-[11px] leading-5 text-slate-600">This is an AI-assisted draft. Check names, dates, identifiers, amounts, and legal references before filing.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
