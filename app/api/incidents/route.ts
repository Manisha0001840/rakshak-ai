import { NextResponse } from "next/server";

import { findBlocklistMatches, findBlocklistMatchesInText } from "../../../lib/blocklist";
import { insertIncident, listIncidents } from "../../../lib/db";
import { scoreAnalysis } from "../../../lib/scoring";
import type {
  AnalysisResult,
  Channel,
  ScamCategory,
  SignalSeverity,
  ThreatSignal,
} from "../../../lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const channels = new Set<Channel>(["text", "audio", "image"]);
const categories = new Set<ScamCategory>([
  "digital_arrest",
  "sextortion",
  "courier_fraud",
  "investment_scam",
  "impersonation",
  "loan_fraud",
  "phishing",
  "job_scam",
  "tech_support",
  "none",
]);
const severities = new Set<SignalSeverity>(["low", "medium", "high", "critical"]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function stringValue(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value.trim() : fallback;
}

function optionalString(value: unknown): string | undefined {
  const normalized = stringValue(value);
  return normalized || undefined;
}

function optionalNumber(value: unknown): number | undefined {
  const normalized = typeof value === "number" ? value : Number(value);
  return Number.isFinite(normalized) ? normalized : undefined;
}

function parseSignals(value: unknown): ThreatSignal[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(isRecord).map((signal) => {
    const severity = stringValue(signal.severity, "low");
    return {
      name: stringValue(signal.name ?? signal.signal, "unknown_signal"),
      quote: stringValue(signal.quote, "Evidence quote unavailable."),
      severity: severities.has(severity as SignalSeverity) ? (severity as SignalSeverity) : "low",
      explanation: optionalString(signal.explanation),
    };
  });
}

function parseAnalysis(value: unknown): AnalysisResult | null {
  if (!isRecord(value)) {
    return null;
  }

  const channel = stringValue(value.channel) as Channel;
  const scamCategory = stringValue(value.scamCategory ?? value.scam_category, "none") as ScamCategory;

  if (!channels.has(channel) || !categories.has(scamCategory)) {
    return null;
  }

  const tacticsValue = value.psychologicalTactics ?? value.psychological_tactics;
  const tactics = Array.isArray(tacticsValue)
    ? tacticsValue.filter((item): item is string => typeof item === "string").map((item) => item.trim()).filter(Boolean)
    : [];

  return {
    id: optionalString(value.id),
    channel,
    rawInput: optionalString(value.rawInput ?? value.raw_input),
    detectedLanguage: stringValue(value.detectedLanguage ?? value.detected_language, "English"),
    scamCategory,
    threatSignals: parseSignals(value.threatSignals ?? value.threat_signals),
    psychologicalTactics: tactics,
    overallRisk: Math.min(100, Math.max(0, Math.round(optionalNumber(value.overallRisk ?? value.overall_risk) ?? 0))),
    confidence: Math.min(1, Math.max(0, optionalNumber(value.confidence) ?? 0)),
    reasoning: stringValue(value.reasoning),
    explanationForVictim: stringValue(value.explanationForVictim ?? value.explanation_for_victim),
    transcript: optionalString(value.transcript),
    transcriptEnglish: optionalString(value.transcriptEnglish ?? value.transcript_english),
    documentType: optionalString(value.documentType ?? value.document_type),
    claimedAuthority: optionalString(value.claimedAuthority ?? value.claimed_authority),
    isLikelyFake: typeof value.isLikelyFake === "boolean" ? value.isLikelyFake : undefined,
    forgeryIndicators: Array.isArray(value.forgeryIndicators)
      ? value.forgeryIndicators.filter((item): item is string => typeof item === "string")
      : undefined,
    scammerPhone: optionalString(value.scammerPhone ?? value.scammer_phone),
    scammerUpi: optionalString(value.scammerUpi ?? value.scammer_upi),
    victimCity: optionalString(value.victimCity ?? value.victim_city),
    victimLat: optionalNumber(value.victimLat ?? value.victim_lat),
    victimLng: optionalNumber(value.victimLng ?? value.victim_lng),
  };
}

function parsePositiveInt(value: string | null, fallback: number): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const level = url.searchParams.get("level") as "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" | null;
    const channel = url.searchParams.get("channel") as Channel | null;
    const category = url.searchParams.get("category") as ScamCategory | null;

    const result = listIncidents({
      page: parsePositiveInt(url.searchParams.get("page"), 1),
      pageSize: Math.min(parsePositiveInt(url.searchParams.get("pageSize"), 25), 100),
      level: level || undefined,
      channel: channel || undefined,
      category: category || undefined,
      search: url.searchParams.get("search") || undefined,
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error("Incident list route failed:", error);
    return NextResponse.json({ error: "Unable to load incidents right now." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const analysis = parseAnalysis(body.analysis ?? body);

    if (!analysis) {
      return NextResponse.json(
        { error: "A valid analysis payload is required to create an incident." },
        { status: 400 },
      );
    }

    const rawInput = analysis.rawInput ?? optionalString(body.rawInput) ?? "";
    const matches = [
      ...findBlocklistMatches({ phone: analysis.scammerPhone, upi: analysis.scammerUpi }),
      ...findBlocklistMatchesInText(rawInput),
    ];
    const uniqueMatches = Array.from(new Map(matches.map((match) => [`${match.entryType}:${match.value}`, match])).values());
    const scored = scoreAnalysis(analysis, uniqueMatches);
    const incident = insertIncident(scored, {
      locale: optionalString(body.locale) ?? analysis.detectedLanguage,
      rawInput,
    });

    return NextResponse.json({ success: true, data: { incident, analysis: scored } }, { status: 201 });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
    }

    console.error("Incident creation route failed:", error);
    return NextResponse.json({ error: "Unable to create this incident right now." }, { status: 500 });
  }
}
