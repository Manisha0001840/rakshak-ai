"use client";

import { FormEvent, useState } from "react";
import { Loader2, MessageSquareText, Send, ShieldAlert, Sparkles } from "lucide-react";

import type { ScoredAnalysis } from "../../../lib/types";

interface TextAnalyzerProps {
  onAnalyzed: (analysis: ScoredAnalysis, incidentId?: string) => void;
}

const demoMessage =
  "This is an officer from the cyber cell. Your Aadhaar is connected to a money-laundering case. Stay on video call and transfer the verification amount immediately, or a police team will arrest you today.";

export default function TextAnalyzer({ onAnalyzed }: TextAnalyzerProps) {
  const [message, setMessage] = useState("");
  const [locale, setLocale] = useState("auto");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedMessage = message.trim();

    if (!trimmedMessage) {
      setError("Paste a suspicious message before analyzing it.");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/analyze/text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: trimmedMessage, locale }),
      });
      const payload = (await response.json()) as {
        data?: { analysis?: ScoredAnalysis; incident?: { id?: string } };
        error?: string;
      };

      if (!response.ok || !payload.data?.analysis) {
        throw new Error(payload.error || "The message could not be analyzed.");
      }

      onAnalyzed(payload.data.analysis, payload.data.incident?.id);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to analyze this message right now.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="glass-panel rounded-3xl p-5 sm:p-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div className="flex gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-400/10 text-blue-300">
            <MessageSquareText className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-base font-semibold text-white">Paste the suspicious message</h2>
            <p className="mt-1 text-xs leading-5 text-slate-500">Keep the wording intact so the signals and evidence quotes remain accurate.</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            setMessage(demoMessage);
            setError("");
          }}
          className="focus-ring inline-flex items-center gap-2 self-start rounded-lg border border-white/10 px-3 py-2 text-xs font-medium text-slate-400 transition hover:border-blue-400/30 hover:bg-blue-400/10 hover:text-blue-200"
        >
          <Sparkles className="h-3.5 w-3.5" />
          Use demo message
        </button>
      </div>

      <div className="mt-6">
        <label htmlFor="suspicious-message" className="sr-only">Suspicious message</label>
        <textarea
          id="suspicious-message"
          value={message}
          onChange={(event) => {
            setMessage(event.target.value);
            if (error) setError("");
          }}
          placeholder="Paste an SMS, WhatsApp message, email, or social media message here..."
          maxLength={20_000}
          rows={9}
          className="focus-ring min-h-52 w-full resize-y rounded-2xl border border-white/10 bg-black/20 px-4 py-4 text-sm leading-6 text-slate-200 outline-none placeholder:text-slate-600 focus:border-blue-400/40 focus:bg-black/30"
        />
        <div className="mt-2 flex items-center justify-between text-[11px] text-slate-600">
          <span>Do not include passwords, full card numbers, or unrelated private information.</span>
          <span>{message.length.toLocaleString("en-IN")} / 20,000</span>
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-4 border-t border-white/10 pt-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <label htmlFor="message-language" className="mb-2 block text-xs font-medium text-slate-400">Message language</label>
          <select
            id="message-language"
            value={locale}
            onChange={(event) => setLocale(event.target.value)}
            className="focus-ring rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-slate-300 outline-none focus:border-blue-400/40"
          >
            <option value="auto" className="bg-slate-900">Detect automatically</option>
            <option value="English" className="bg-slate-900">English</option>
            <option value="Hindi" className="bg-slate-900">Hindi</option>
            <option value="Hinglish" className="bg-slate-900">Hinglish</option>
            <option value="Tamil" className="bg-slate-900">Tamil</option>
            <option value="Bengali" className="bg-slate-900">Bengali</option>
          </select>
        </div>
        <button type="submit" disabled={isLoading || !message.trim()} className="focus-ring button-primary inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50">
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          {isLoading ? "Analyzing..." : "Analyze message"}
        </button>
      </div>

      {error && (
        <div className="mt-5 flex items-start gap-3 rounded-2xl border border-red-400/20 bg-red-400/[0.07] p-4 text-sm text-red-200" role="alert">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </form>
  );
}
