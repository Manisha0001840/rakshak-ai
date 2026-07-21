"use client";

import { useState } from "react";
import { Check, Loader2, ThumbsDown, ThumbsUp } from "lucide-react";

import type { FeedbackValue } from "../../../lib/types";

interface FeedbackButtonsProps {
  incidentId?: string;
  initialFeedback?: FeedbackValue;
}

export default function FeedbackButtons({ incidentId, initialFeedback = "pending" }: FeedbackButtonsProps) {
  const [feedback, setFeedback] = useState<FeedbackValue>(initialFeedback);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  async function submitFeedback(value: Exclude<FeedbackValue, "pending">) {
    if (!incidentId) {
      setError("This result is not linked to a saved incident yet.");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ incidentId, feedback: value }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(payload.error || "Feedback could not be saved.");
      setFeedback(value);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to save feedback right now.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="glass-card rounded-2xl px-4 py-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-slate-200">Was this a scam?</p>
          <p className="mt-1 text-xs text-slate-500">Your feedback helps improve community safety signals.</p>
        </div>
        {feedback === "pending" ? (
          <div className="flex gap-2">
            <button type="button" disabled={isLoading} onClick={() => void submitFeedback("scam")} className="focus-ring inline-flex items-center gap-2 rounded-xl border border-red-400/20 bg-red-400/[0.06] px-3 py-2 text-xs font-medium text-red-200 transition hover:bg-red-400/15 disabled:opacity-50">
              {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ThumbsUp className="h-3.5 w-3.5" />}
              Yes, it was a scam
            </button>
            <button type="button" disabled={isLoading} onClick={() => void submitFeedback("not_scam")} className="focus-ring inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-medium text-slate-300 transition hover:bg-white/[0.08] disabled:opacity-50">
              <ThumbsDown className="h-3.5 w-3.5" />
              No
            </button>
          </div>
        ) : (
          <span className="inline-flex items-center gap-2 text-xs font-medium text-emerald-300"><Check className="h-4 w-4" />Thanks for helping</span>
        )}
      </div>
      {error && <p className="mt-3 text-xs text-red-300" role="alert">{error}</p>}
    </div>
  );
}
