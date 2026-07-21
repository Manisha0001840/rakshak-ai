import {
  GoogleGenerativeAI,
  HarmBlockThreshold,
  HarmCategory,
  type Part,
} from "@google/generative-ai";

import {
  buildAudioAnalysisPrompt,
  buildComplaintPrompt,
  buildEvidenceSummaryPrompt,
  buildImageAnalysisPrompt,
  buildTextAnalysisPrompt,
  buildVictimAdvisoryPrompt,
} from "./prompts";
import type {
  AnalysisResult,
  Channel,
  ComplaintDraft,
  EvidenceSummary,
  Incident,
  ScoredAnalysis,
  ThreatSignal,
  VictimAdvisory,
} from "./types";

// Keep the model configurable so the app can follow Google's model availability
// without requiring a code change. This default supports text, image, and audio.
const MODEL_NAME = process.env.GEMINI_MODEL?.trim() || "gemini-3.5-flash";

const generationConfig = {
  responseMimeType: "application/json",
  temperature: 0.2,
  maxOutputTokens: 4096,
};

const safetySettings = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
];

const allowedCategories = new Set([
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

export class GeminiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GeminiError";
  }
}

interface RawThreatSignal {
  name?: unknown;
  signal?: unknown;
  quote?: unknown;
  severity?: unknown;
  explanation?: unknown;
}

interface RawAnalysisPayload {
  detected_language?: unknown;
  scam_category?: unknown;
  threat_signals?: unknown;
  psychological_tactics?: unknown;
  overall_risk?: unknown;
  confidence?: unknown;
  reasoning?: unknown;
  explanation_for_victim?: unknown;
  transcript?: unknown;
  transcript_english?: unknown;
  document_type?: unknown;
  claimed_authority?: unknown;
  is_likely_fake?: unknown;
  forgery_indicators?: unknown;
  scammer_phone?: unknown;
  scammer_upi?: unknown;
  victim_city?: unknown;
  victim_lat?: unknown;
  victim_lng?: unknown;
}

interface RawComplaintPayload {
  subject?: unknown;
  complaint_text?: unknown;
  applicable_sections?: unknown;
  filing_instructions?: unknown;
  additional_steps?: unknown;
}

interface RawAdvisoryPayload {
  advisory_title?: unknown;
  advisory_body?: unknown;
  emergency_contacts?: unknown;
  key_facts?: unknown;
}

interface RawEvidencePayload {
  summary_title?: unknown;
  executive_summary?: unknown;
  incident_narrative?: unknown;
  modus_operandi?: unknown;
  identifiers_extracted?: unknown;
  recommended_sections?: unknown;
  recommended_actions?: unknown;
}

function getModel() {
  const apiKey = process.env.GEMINI_API_KEY?.trim();

  if (!apiKey) {
    throw new GeminiError("GEMINI_API_KEY is not configured. Add it to .env.local.");
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({
    model: MODEL_NAME,
    generationConfig,
    safetySettings,
  });
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value.trim() : fallback;
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string").map((item) => item.trim()).filter(Boolean);
}

function asNumber(value: unknown, fallback = 0): number {
  const numberValue = typeof value === "number" ? value : Number(value);
  return Number.isFinite(numberValue) ? numberValue : fallback;
}

function asNullableString(value: unknown): string | undefined {
  const normalized = asString(value);
  return normalized || undefined;
}

function asNullableNumber(value: unknown): number | undefined {
  const normalized = asNumber(value, Number.NaN);
  return Number.isFinite(normalized) ? normalized : undefined;
}

function parseJson<T>(text: string): T {
  const cleaned = text
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  try {
    return JSON.parse(cleaned) as T;
  } catch {
    const objectStart = cleaned.indexOf("{");
    const objectEnd = cleaned.lastIndexOf("}");
    if (objectStart >= 0 && objectEnd > objectStart) {
      try {
        return JSON.parse(cleaned.slice(objectStart, objectEnd + 1)) as T;
      } catch {
        // Fall through to a useful error below.
      }
    }

    throw new GeminiError("Gemini returned malformed JSON.");
  }
}

async function generateJson<T>(contents: string | Part[]): Promise<T> {
  try {
    const result = await getModel().generateContent(contents);
    const response = result.response;
    const responseText = response.text();

    if (!responseText.trim()) {
      throw new GeminiError("Gemini returned an empty response.");
    }

    return parseJson<T>(responseText);
  } catch (error) {
    if (error instanceof GeminiError) {
      throw error;
    }

    const message = error instanceof Error ? error.message : "Unknown Gemini API error.";
    throw new GeminiError(`Gemini request failed: ${message}`);
  }
}

function normalizeAnalysis(payload: RawAnalysisPayload, channel: Channel, rawInput?: string): AnalysisResult {
  const rawSignals = Array.isArray(payload.threat_signals) ? payload.threat_signals : [];
  const threatSignals: ThreatSignal[] = rawSignals
    .filter((signal): signal is RawThreatSignal => Boolean(signal && typeof signal === "object"))
    .map((signal) => ({
      name: asString(signal.name ?? signal.signal, "unknown_signal"),
      quote: asString(signal.quote, "Evidence quote unavailable."),
      severity: asString(signal.severity, "low") as ThreatSignal["severity"],
      explanation: asNullableString(signal.explanation),
    }));

  const category = asString(payload.scam_category, "none");
  const confidence = Math.min(1, Math.max(0, asNumber(payload.confidence, 0)));

  return {
    channel,
    rawInput,
    detectedLanguage: asString(payload.detected_language, "English"),
    scamCategory: allowedCategories.has(category) ? (category as AnalysisResult["scamCategory"]) : "none",
    threatSignals,
    psychologicalTactics: asStringArray(payload.psychological_tactics),
    overallRisk: Math.min(100, Math.max(0, Math.round(asNumber(payload.overall_risk, 0)))),
    confidence,
    reasoning: asString(payload.reasoning, "The model did not provide additional reasoning."),
    explanationForVictim: asString(
      payload.explanation_for_victim,
      "Pause, do not share more information, and verify the request through an official channel.",
    ),
    transcript: asNullableString(payload.transcript),
    transcriptEnglish: asNullableString(payload.transcript_english),
    documentType: asNullableString(payload.document_type),
    claimedAuthority: asNullableString(payload.claimed_authority),
    isLikelyFake: typeof payload.is_likely_fake === "boolean" ? payload.is_likely_fake : undefined,
    forgeryIndicators: asStringArray(payload.forgery_indicators),
    scammerPhone: asNullableString(payload.scammer_phone),
    scammerUpi: asNullableString(payload.scammer_upi),
    victimCity: asNullableString(payload.victim_city),
    victimLat: asNullableNumber(payload.victim_lat),
    victimLng: asNullableNumber(payload.victim_lng),
  };
}

function inlinePart(data: Buffer | Uint8Array, mimeType: string): Part {
  return {
    inlineData: {
      data: Buffer.from(data).toString("base64"),
      mimeType,
    },
  };
}

export async function analyzeText(message: string, localeHint = "auto"): Promise<AnalysisResult> {
  const payload = await generateJson<RawAnalysisPayload>(buildTextAnalysisPrompt(message, localeHint));
  return normalizeAnalysis(payload, "text", message);
}

export async function analyzeAudio(
  audio: Buffer | Uint8Array,
  mimeType = "audio/webm",
  localeHint = "auto",
): Promise<AnalysisResult> {
  const contents: Part[] = [
    { text: buildAudioAnalysisPrompt(localeHint) },
    inlinePart(audio, mimeType),
  ];
  const payload = await generateJson<RawAnalysisPayload>(contents);
  return normalizeAnalysis(payload, "audio");
}

export async function analyzeImage(
  image: Buffer | Uint8Array,
  mimeType = "image/jpeg",
): Promise<AnalysisResult> {
  const contents: Part[] = [
    { text: buildImageAnalysisPrompt() },
    inlinePart(image, mimeType),
  ];
  const payload = await generateJson<RawAnalysisPayload>(contents);
  return normalizeAnalysis(payload, "image");
}

export async function generateComplaint(
  analysis: AnalysisResult | ScoredAnalysis,
): Promise<ComplaintDraft> {
  const payload = await generateJson<RawComplaintPayload>(buildComplaintPrompt(analysis));
  return {
    subject: asString(payload.subject, "Suspected cyber fraud incident"),
    complaintText: asString(payload.complaint_text, "Please review the attached evidence for a suspected cyber fraud incident."),
    applicableSections: asStringArray(payload.applicable_sections),
    filingInstructions: asStringArray(payload.filing_instructions),
    additionalSteps: asStringArray(payload.additional_steps),
  };
}

export async function generateVictimAdvisory(
  analysis: AnalysisResult | ScoredAnalysis,
): Promise<VictimAdvisory> {
  const payload = await generateJson<RawAdvisoryPayload>(buildVictimAdvisoryPrompt(analysis));
  return {
    advisoryTitle: asString(payload.advisory_title, "You are not alone — take a safe next step"),
    advisoryBody: asString(
      payload.advisory_body,
      "Stop communication with the suspected scammer and verify any request through an official channel.",
    ),
    emergencyContacts: asStringArray(payload.emergency_contacts),
    keyFacts: asStringArray(payload.key_facts),
  };
}

export async function generateEvidenceSummary(
  incident: Incident | ScoredAnalysis,
): Promise<EvidenceSummary> {
  const payload = await generateJson<RawEvidencePayload>(buildEvidenceSummaryPrompt(incident));
  return {
    summaryTitle: asString(payload.summary_title, "Digital fraud intelligence summary"),
    executiveSummary: asString(payload.executive_summary, "The supplied record requires officer review."),
    incidentNarrative: asString(payload.incident_narrative, "No incident narrative was generated."),
    modusOperandi: asString(payload.modus_operandi, "Insufficient evidence to determine a modus operandi."),
    identifiersExtracted: asStringArray(payload.identifiers_extracted),
    recommendedSections: asStringArray(payload.recommended_sections),
    recommendedActions: asStringArray(payload.recommended_actions),
  };
}
