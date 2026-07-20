import type { AnalysisResult, EvidenceSummary, Incident, ScoredAnalysis } from "./types";

const scamCategories = [
  "digital_arrest",
  "sextortion",
  "courier_fraud",
  "investment_scam",
  "loan_fraud",
  "job_scam",
  "tech_support",
  "phishing",
  "impersonation",
  "none",
].join(", ");

const signalNames = [
  "impersonation",
  "legal_threat",
  "urgency",
  "isolation",
  "money_demand",
  "identity_harvest",
  "emotional_manipulation",
  "fake_authority",
].join(", ");

const tacticNames = ["fear", "authority", "urgency", "isolation", "secrecy", "greed", "shame", "trust"].join(
  ", ",
);

const sharedAnalysisRules = `
You are a careful fraud analyst supporting India's I4C (Indian Cyber Crime Coordination Centre).
Analyze the supplied material for scam indicators while minimizing false positives.

Allowed scam_category values: ${scamCategories}.
Allowed threat signal names: ${signalNames}.
Allowed psychological tactic values: ${tacticNames}.
Allowed signal severities: low, medium, high, critical.

Important false-positive protections:
- Do not flag a legitimate bank OTP or transaction alert solely because it contains an OTP.
- Do not flag a genuine delivery notification solely because it contains a tracking link or delivery fee.
- Do not flag a real government communication solely because it mentions a department or legal process.
- Treat a .gov.in or .nic.in URL as a positive authenticity signal, but do not assume a URL is genuine without considering its surrounding context.
- Never invent a phone number, UPI ID, quote, legal section, or document detail that is not present in the evidence.
- If the evidence is insufficient, use scam_category "none", explain the uncertainty, and keep confidence low.

Return valid JSON only. Do not wrap the JSON in Markdown. Use exact field names and keep evidence quotes verbatim.
`;

const textOutputShape = `
{
  "detected_language": "English or the detected language",
  "scam_category": "one allowed category",
  "threat_signals": [
    { "name": "one allowed signal", "quote": "exact short quote", "severity": "low|medium|high|critical", "explanation": "why it matters" }
  ],
  "psychological_tactics": ["one or more allowed tactics"],
  "overall_risk": 0,
  "confidence": 0.0,
  "reasoning": "brief analyst reasoning grounded in the evidence",
  "explanation_for_victim": "calming, practical explanation in the detected language",
  "scammer_phone": null,
  "scammer_upi": null,
  "victim_city": null
}
`;

const fewShotExamples = `
Few-shot examples:

Example A — critical digital arrest scam:
Input: "This is CBI officer Verma. Your Aadhaar is linked to a money laundering case. Stay on video call and transfer the security amount to the RBI safe vault account immediately. If you disconnect, you will be arrested."
Expected reasoning: category digital_arrest; signals include fake_authority, legal_threat, isolation, urgency, and money_demand; high or critical risk.

Example B — legitimate bank SMS:
Input: "Your OTP for an online purchase at Example Bank is 482913. Do not share this OTP with anyone. If you did not initiate this transaction, call the number printed on your debit card."
Expected reasoning: category none; the message warns the customer not to share the OTP and provides a normal verification route; do not flag it solely for containing an OTP.

Example C — subtle investment scam:
Input: "Our private government-approved trading group has a guaranteed 40% weekly return. Slots close tonight. Send ₹25,000 to the trainer's UPI to unlock your premium account."
Expected reasoning: category investment_scam; signals include fake_authority, urgency, greed, and money_demand; high risk because of guaranteed returns and an advance payment request.
`;

function embeddedEvidence(value: string, maxLength = 16000): string {
  const trimmed = value.trim().slice(0, maxLength);
  return trimmed || "[No evidence supplied]";
}

function serializeAnalysis(analysis: AnalysisResult | ScoredAnalysis | Incident): string {
  return JSON.stringify(analysis, null, 2).slice(0, 24000);
}

export function buildTextAnalysisPrompt(message: string, localeHint = "auto"): string {
  return `${sharedAnalysisRules}

Task: Analyze a suspicious text message pasted by a citizen.
Language hint: ${localeHint}.
Extract exact evidence quotes, identify the scam category and psychological tactics, and provide a calming victim explanation in the user's language.
Extract a scammer_phone or scammer_upi only when explicitly present. Normalize neither value beyond removing obvious surrounding punctuation.

Required JSON shape:
${textOutputShape}

${fewShotExamples}

Message to analyze:
<message>
${embeddedEvidence(message)}
</message>`;
}

export function buildAudioAnalysisPrompt(localeHint = "auto"): string {
  return `${sharedAnalysisRules}

Task: Analyze the attached audio recording of a suspected scam call.
The audio bytes are attached to this request. Transcribe the recording word-for-word in its original language; do not summarize the transcript.
Mark speaker changes as [CALLER] and [RECEIVER]. Add inline cues such as [call center background], [scripted speech], [multiple voices], or [unclear] only when supported by the audio.
Also provide an accurate English translation in transcript_english. Preserve meaningful pauses, threats, demands, and repeated phrases.

Required JSON shape:
{
  "detected_language": "detected language",
  "transcript": "verbatim transcript with [CALLER]/[RECEIVER] markers",
  "transcript_english": "faithful English translation",
  "scam_category": "one allowed category",
  "threat_signals": [
    { "name": "one allowed signal", "quote": "exact transcript quote", "severity": "low|medium|high|critical", "explanation": "why it matters" }
  ],
  "psychological_tactics": ["one or more allowed tactics"],
  "overall_risk": 0,
  "confidence": 0.0,
  "reasoning": "brief evidence-grounded reasoning",
  "explanation_for_victim": "calming practical explanation in the detected language",
  "scammer_phone": null,
  "scammer_upi": null,
  "victim_city": null,
  "audio_cues": ["only cues directly supported by the recording"]
}

Language hint: ${localeHint}.
If the recording is silent, corrupted, or unintelligible, say so in the transcript and lower confidence instead of inventing words.`;
}

export function buildImageAnalysisPrompt(): string {
  return `${sharedAnalysisRules}

Task: Analyze the attached document image or screenshot for signs of forgery, coercion, or a scam.
The image may claim to be a CBI warrant, ED notice, police notice, court order, RBI instruction, courier notice, or another government document.
Check specifically for:
- forged or distorted government emblems;
- misspelled agency names, inconsistent typography, or mismatched seals;
- fake case numbers, fabricated signatures, or non-existent legal sections;
- the phrase or concept of "digital arrest", which is not a recognized arrest procedure in Indian law;
- claims about an "RBI Safe Vault Account" or similar personal transfer destination;
- URLs that do not end in .gov.in or .nic.in, while remembering that a domain alone is not proof of authenticity;
- requests to pay money, reveal OTPs, install remote-access software, or remain on a video call.

Return valid JSON only using this shape:
{
  "detected_language": "detected language",
  "document_type": "claimed document type",
  "claimed_authority": "authority named on the document",
  "is_likely_fake": true,
  "forgery_indicators": ["specific visible indicator with location or exact text where possible"],
  "scam_category": "one allowed category",
  "threat_signals": [
    { "name": "one allowed signal", "quote": "exact visible quote", "severity": "low|medium|high|critical", "explanation": "why it matters" }
  ],
  "psychological_tactics": ["one or more allowed tactics"],
  "overall_risk": 0,
  "confidence": 0.0,
  "reasoning": "brief evidence-grounded reasoning",
  "explanation_for_victim": "calming practical explanation in the detected language",
  "scammer_phone": null,
  "scammer_upi": null,
  "victim_city": null
}

Do not declare a document fake just because it looks informal or uses a non-English language. If the image is too blurry to inspect, state the limitation and lower confidence.`;
}

export function buildComplaintPrompt(analysis: AnalysisResult | ScoredAnalysis): string {
  return `You are preparing a formal draft for India's National Cyber Crime Reporting Portal (cybercrime.gov.in).

Use only the supplied analysis and evidence. Do not invent names, dates, phone numbers, UPI IDs, quotes, legal sections, or financial amounts. Preserve exact evidence quotes where available.
Write in formal, clear English. The draft is for citizen review and must not claim that a legal section definitely applies; label uncertain sections as "for review by the investigating officer".
Include immediate safety guidance: preserve the original evidence, do not contact the suspected scammer again, and call 1930 promptly if money was transferred.

Return valid JSON only:
{
  "subject": "concise complaint subject",
  "complaint_text": "formal incident description with evidence-based details",
  "applicable_sections": ["possible BNS or IT Act provisions, each with a short reason and officer-review caveat"],
  "filing_instructions": ["practical steps for cybercrime.gov.in or the local cyber police station"],
  "additional_steps": ["evidence preservation and account safety actions"]
}

Analysis:
<analysis>
${serializeAnalysis(analysis)}
</analysis>`;
}

export function buildVictimAdvisoryPrompt(analysis: AnalysisResult | ScoredAnalysis): string {
  return `You are a trauma-informed cyber-safety educator helping a person who may have encountered a scam.

Write an empathetic advisory in the user's detected language when possible. Keep it calm, non-judgmental, and practical. Structure the body as:
1. reassurance;
2. what this scam appears to be;
3. why it seemed believable;
4. key facts that reduce fear;
5. what to do now;
6. reassurance that help is available.

Do not shame the victim or tell them to confront the suspected scammer. Do not invent facts beyond the supplied analysis.
Mention 1930 for immediate financial cyber-fraud reporting, 112 for an immediate physical emergency, and cybercrime.gov.in where relevant.

Return valid JSON only:
{
  "advisory_title": "short reassuring title",
  "advisory_body": "structured advisory in the user's language",
  "emergency_contacts": ["contact and when to use it"],
  "key_facts": ["short factual reassurance points"]
}

Analysis:
<analysis>
${serializeAnalysis(analysis)}
</analysis>`;
}

export function buildEvidenceSummaryPrompt(incident: Incident | ScoredAnalysis): string {
  return `You are preparing a formal intelligence summary for a police evidence package.

Use objective third-person language. Cite the supplied evidence for every factual claim. Clearly distinguish observed evidence from analyst inference. Do not invent a suspect identity, location, legal conclusion, or connection that is not present in the record.
Summarize the likely modus operandi, identifiers extracted, possible legal sections for officer review, and recommended investigative actions. Preserve original quotes in short excerpts only when they support a claim.

Return valid JSON only:
{
  "summary_title": "formal evidence summary title",
  "executive_summary": "objective overview of the incident and risk",
  "incident_narrative": "chronological narrative grounded in the supplied record",
  "modus_operandi": "observed or reasonably inferred scam method, with evidence boundaries",
  "identifiers_extracted": ["phone, UPI, URL, account, city, or other identifier actually present"],
  "recommended_sections": ["possible BNS or IT Act provisions for officer review"],
  "recommended_actions": ["evidence preservation, identifier checks, victim protection, and investigative next steps"]
}

Incident record:
<incident>
${serializeAnalysis(incident)}
</incident>`;
}

export interface GeminiPromptSet {
  text: typeof buildTextAnalysisPrompt;
  audio: typeof buildAudioAnalysisPrompt;
  image: typeof buildImageAnalysisPrompt;
  complaint: typeof buildComplaintPrompt;
  advisory: typeof buildVictimAdvisoryPrompt;
  evidence: typeof buildEvidenceSummaryPrompt;
}

export const prompts: GeminiPromptSet = {
  text: buildTextAnalysisPrompt,
  audio: buildAudioAnalysisPrompt,
  image: buildImageAnalysisPrompt,
  complaint: buildComplaintPrompt,
  advisory: buildVictimAdvisoryPrompt,
  evidence: buildEvidenceSummaryPrompt,
};

