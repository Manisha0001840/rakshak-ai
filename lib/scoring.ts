import type {
  AnalysisResult,
  BlocklistMatch,
  ScoredAnalysis,
  ScoreBreakdown,
  SignalSeverity,
  ThreatLevel,
  ThreatSignal,
} from "./types";

export const CATEGORY_WEIGHTS: Record<AnalysisResult["scamCategory"], number> = {
  digital_arrest: 30,
  sextortion: 25,
  courier_fraud: 22,
  investment_scam: 20,
  impersonation: 20,
  loan_fraud: 18,
  phishing: 18,
  job_scam: 12,
  tech_support: 10,
  none: 0,
};

export const SEVERITY_POINTS: Record<SignalSeverity, number> = {
  low: 2,
  medium: 5,
  high: 10,
  critical: 15,
};

export const THREAT_LEVELS: Array<{ minimum: number; level: ThreatLevel }> = [
  { minimum: 75, level: "CRITICAL" },
  { minimum: 50, level: "HIGH" },
  { minimum: 30, level: "MEDIUM" },
  { minimum: 0, level: "LOW" },
];

function normalizeSeverity(value: unknown): SignalSeverity {
  return value === "critical" || value === "high" || value === "medium" || value === "low"
    ? value
    : "low";
}

function uniqueNonEmpty(values: string[]): string[] {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

export function getThreatLevel(score: number): ThreatLevel {
  const normalized = Math.min(100, Math.max(0, Math.round(score)));
  return THREAT_LEVELS.find((threshold) => normalized >= threshold.minimum)?.level ?? "LOW";
}

export function calculateScoreBreakdown(
  analysis: AnalysisResult,
  blocklistMatches: BlocklistMatch[] = [],
): ScoreBreakdown {
  const category = CATEGORY_WEIGHTS[analysis.scamCategory] ?? 0;
  const tacticCount = uniqueNonEmpty(analysis.psychologicalTactics).length;
  const tactics = Math.min(tacticCount * 5, 25);
  const signals = Math.min(
    analysis.threatSignals.reduce((total, signal) => {
      return total + SEVERITY_POINTS[normalizeSeverity(signal.severity)];
    }, 0),
    30,
  );
  const hasUpiMatch = blocklistMatches.some((match) => match.entryType === "upi");
  const hasPhoneMatch = blocklistMatches.some((match) => match.entryType === "phone");
  const blocklist = (hasUpiMatch ? 15 : 0) + (hasPhoneMatch ? 10 : 0);
  const total = Math.min(100, category + tactics + signals + blocklist);

  return { category, tactics, signals, blocklist, total };
}

export function scoreAnalysis(
  analysis: AnalysisResult,
  blocklistMatches: BlocklistMatch[] = [],
): ScoredAnalysis {
  const scoreBreakdown = calculateScoreBreakdown(analysis, blocklistMatches);

  return {
    ...analysis,
    threatScore: scoreBreakdown.total,
    threatLevel: getThreatLevel(scoreBreakdown.total),
    scoreBreakdown,
    blocklistMatches,
  };
}

export function scoreFromParts(
  category: AnalysisResult["scamCategory"],
  tactics: string[],
  signals: ThreatSignal[],
  blocklistMatches: BlocklistMatch[] = [],
): ScoreBreakdown {
  return calculateScoreBreakdown(
    {
      channel: "text",
      detectedLanguage: "en",
      scamCategory: category,
      threatSignals: signals,
      psychologicalTactics: tactics,
      overallRisk: 0,
      confidence: 0,
      reasoning: "",
      explanationForVictim: "",
    },
    blocklistMatches,
  );
}
