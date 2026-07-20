export type Channel = "text" | "audio" | "image";

export type ThreatLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type ScamCategory =
  | "digital_arrest"
  | "sextortion"
  | "courier_fraud"
  | "investment_scam"
  | "impersonation"
  | "loan_fraud"
  | "phishing"
  | "job_scam"
  | "tech_support"
  | "none";

export type SignalSeverity = "low" | "medium" | "high" | "critical";

export type SignalType =
  | "impersonation"
  | "legal_threat"
  | "urgency"
  | "isolation"
  | "money_demand"
  | "identity_harvest"
  | "emotional_manipulation"
  | "fake_authority";

export type PsychologicalTactic =
  | "fear"
  | "authority"
  | "urgency"
  | "isolation"
  | "secrecy"
  | "greed"
  | "shame"
  | "trust";

export type FeedbackValue = "pending" | "scam" | "not_scam";

export type GraphNodeType =
  | "scammer_phone"
  | "scammer_upi"
  | "victim"
  | "mule_account";

export interface ThreatSignal {
  name: SignalType | string;
  quote: string;
  severity: SignalSeverity;
  explanation?: string;
}

export interface ScoreBreakdown {
  category: number;
  tactics: number;
  signals: number;
  blocklist: number;
  total: number;
}

export interface BlocklistMatch {
  entryType: "phone" | "upi";
  value: string;
  reportedCount?: number;
  source?: string;
}

export interface AnalysisResult {
  id?: string;
  channel: Channel;
  rawInput?: string;
  detectedLanguage: string;
  scamCategory: ScamCategory;
  threatSignals: ThreatSignal[];
  psychologicalTactics: Array<PsychologicalTactic | string>;
  overallRisk: number;
  confidence: number;
  reasoning: string;
  explanationForVictim: string;
  transcript?: string;
  transcriptEnglish?: string;
  documentType?: string;
  claimedAuthority?: string;
  isLikelyFake?: boolean;
  forgeryIndicators?: string[];
  scammerPhone?: string;
  scammerUpi?: string;
  victimCity?: string;
  victimLat?: number;
  victimLng?: number;
}

export interface ScoredAnalysis extends AnalysisResult {
  threatScore: number;
  threatLevel: ThreatLevel;
  scoreBreakdown: ScoreBreakdown;
  blocklistMatches: BlocklistMatch[];
}

export interface Incident {
  id: string;
  createdAt: string;
  channel: Channel;
  rawInput: string | null;
  locale: string;
  scamCategory: ScamCategory;
  threatScore: number;
  threatLevel: ThreatLevel;
  scoreBreakdown: ScoreBreakdown;
  threatSignals: ThreatSignal[];
  tactics: Array<PsychologicalTactic | string>;
  explanation: string;
  scammerPhone: string | null;
  scammerUpi: string | null;
  victimCity: string | null;
  victimLat: number | null;
  victimLng: number | null;
  feedback: FeedbackValue;
  complaintFiled: boolean;
}

export interface FraudGraphNode {
  id: string;
  nodeType: GraphNodeType;
  value: string;
  firstSeen: string;
  incidentCount: number;
  city: string | null;
}

export interface FraudGraphEdge {
  id: string;
  sourceNodeId: string;
  targetNodeId: string;
  relationship: string;
  incidentId: string | null;
  createdAt: string;
}

export interface FraudGraphData {
  nodes: FraudGraphNode[];
  edges: FraudGraphEdge[];
}

export interface LevelCounts {
  LOW: number;
  MEDIUM: number;
  HIGH: number;
  CRITICAL: number;
}

export interface DashboardStats {
  totalIncidents: number;
  incidentsToday: number;
  criticalToday: number;
  highRiskOpen: number;
  complaintsFiled: number;
  averageThreatScore: number;
  levelCounts: LevelCounts;
  categoryCounts: Record<string, number>;
  cityCounts: Record<string, number>;
}

export interface MapIncidentPoint {
  id: string;
  city: string;
  lat: number;
  lng: number;
  threatScore: number;
  threatLevel: ThreatLevel;
  category: ScamCategory;
}

export interface ComplaintDraft {
  subject: string;
  complaintText: string;
  applicableSections: string[];
  filingInstructions: string[];
  additionalSteps: string[];
}

export interface VictimAdvisory {
  advisoryTitle: string;
  advisoryBody: string;
  emergencyContacts: string[];
  keyFacts: string[];
}

export interface EvidenceSummary {
  summaryTitle: string;
  executiveSummary: string;
  incidentNarrative: string;
  modusOperandi: string;
  identifiersExtracted: string[];
  recommendedSections: string[];
  recommendedActions: string[];
}

export interface ApiError {
  error: string;
  details?: string;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
}

export interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

