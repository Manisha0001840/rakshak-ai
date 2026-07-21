"use client";

import { useEffect } from "react";
import { AlertOctagon, ArrowRight, PhoneCall, ShieldAlert, X } from "lucide-react";

import type { ScoredAnalysis } from "../../../lib/types";

interface AlertOverlayProps {
  open: boolean;
  analysis: ScoredAnalysis | null;
  onClose: () => void;
  onFileComplaint?: () => void;
}

function titleCase(value: string): string {
  return value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default function AlertOverlay({ open, analysis, onClose, onFileComplaint }: AlertOverlayProps) {
  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-[#21090d]/90 p-4 backdrop-blur-md sm:p-6" role="dialog" aria-modal="true" aria-labelledby="critical-alert-title">
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute left-1/2 top-1/2 h-[34rem] w-[34rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-red-400/10 critical-pulse" />
        <div className="absolute left-1/2 top-1/2 h-[24rem] w-[24rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-red-400/10 critical-pulse [animation-delay:350ms]" />
      </div>

      <div className="relative w-full max-w-xl overflow-hidden rounded-[2rem] border border-red-400/30 bg-[#150c12] shadow-glow-critical">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-red-500 via-orange-400 to-red-500" />
        <button type="button" onClick={onClose} className="focus-ring absolute right-4 top-4 z-10 rounded-xl p-2 text-red-200/60 transition hover:bg-white/10 hover:text-white" aria-label="Close emergency warning">
          <X className="h-5 w-5" />
        </button>

        <div className="p-6 text-center sm:p-10">
          <span className="critical-pulse mx-auto flex h-16 w-16 items-center justify-center rounded-3xl border border-red-400/30 bg-red-400/10 text-red-300">
            <AlertOctagon className="h-8 w-8" />
          </span>
          <p className="mt-6 text-xs font-semibold uppercase tracking-[0.24em] text-red-300">Critical threat detected</p>
          <h2 id="critical-alert-title" className="mt-3 text-3xl font-semibold tracking-[-0.045em] text-white">Pause. Do not send money.</h2>
          <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-red-100/70">
            This appears consistent with a high-risk {analysis ? titleCase(analysis.scamCategory).toLowerCase() : "scam"}. The person contacting you may be using fear or urgency to stop you from verifying the request.
          </p>

          <div className="mt-7 rounded-2xl border border-red-400/15 bg-red-400/[0.06] p-4 text-left">
            <div className="flex gap-3">
              <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-red-300" />
              <div className="text-sm leading-6 text-red-100/80">
                <p className="font-semibold text-red-100">Do these things now</p>
                <ul className="mt-2 space-y-1.5 text-red-100/70">
                  <li>• Hang up or stop replying.</li>
                  <li>• Do not share OTPs, passwords, or screen access.</li>
                  <li>• Preserve the message, call recording, and payment details.</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="mt-7 grid gap-3 sm:grid-cols-2">
            <button type="button" onClick={onClose} className="focus-ring inline-flex items-center justify-center gap-2 rounded-xl border border-red-300/30 bg-red-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-400">
              <PhoneCall className="h-4 w-4" />
              Hang up / stop
            </button>
            <a href="tel:1930" className="focus-ring inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.08] px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.14]">
              <PhoneCall className="h-4 w-4" />
              Call 1930
            </a>
          </div>

          <button type="button" onClick={onFileComplaint ?? onClose} className="focus-ring mt-4 inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-red-200/80 transition hover:bg-white/5 hover:text-white">
            File a cybercrime complaint
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
