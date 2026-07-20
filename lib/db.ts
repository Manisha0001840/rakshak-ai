import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";

import Database from "better-sqlite3";

import type {
  AnalysisResult,
  Channel,
  DashboardStats,
  FeedbackValue,
  FraudGraphData,
  FraudGraphEdge,
  FraudGraphNode,
  Incident,
  MapIncidentPoint,
  ScamCategory,
  ScoredAnalysis,
  ScoreBreakdown,
  ThreatLevel,
  ThreatSignal,
} from "./types";

type SQLiteDatabase = Database.Database;

const databasePath = path.resolve(
  process.env.RAKSHAK_DB_PATH ?? path.join(process.cwd(), "data", "rakshak.sqlite"),
);

const schema = `
  CREATE TABLE IF NOT EXISTS incidents (
    id              TEXT PRIMARY KEY,
    created_at      TEXT NOT NULL DEFAULT (datetime('now')),
    channel         TEXT NOT NULL,
    raw_input       TEXT,
    locale          TEXT DEFAULT 'en',
    scam_category   TEXT,
    threat_score    INTEGER NOT NULL,
    threat_level    TEXT NOT NULL,
    score_breakdown TEXT,
    threat_signals  TEXT,
    tactics         TEXT,
    explanation     TEXT,
    scammer_phone   TEXT,
    scammer_upi     TEXT,
    victim_city     TEXT,
    victim_lat      REAL,
    victim_lng      REAL,
    feedback        TEXT DEFAULT 'pending',
    complaint_filed INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS graph_nodes (
    id              TEXT PRIMARY KEY,
    node_type       TEXT NOT NULL,
    value           TEXT NOT NULL UNIQUE,
    first_seen      TEXT NOT NULL DEFAULT (datetime('now')),
    incident_count  INTEGER DEFAULT 1,
    city            TEXT
  );

  CREATE TABLE IF NOT EXISTS graph_edges (
    id              TEXT PRIMARY KEY,
    source_node_id  TEXT NOT NULL REFERENCES graph_nodes(id),
    target_node_id  TEXT NOT NULL REFERENCES graph_nodes(id),
    relationship    TEXT NOT NULL,
    incident_id     TEXT REFERENCES incidents(id),
    created_at      TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS blocklist (
    id              TEXT PRIMARY KEY,
    entry_type      TEXT NOT NULL,
    value           TEXT NOT NULL UNIQUE,
    reported_count  INTEGER DEFAULT 1,
    source          TEXT DEFAULT 'seed',
    created_at      TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_incidents_level ON incidents(threat_level);
  CREATE INDEX IF NOT EXISTS idx_incidents_created_at ON incidents(created_at);
  CREATE INDEX IF NOT EXISTS idx_blocklist_value ON blocklist(value);
  CREATE INDEX IF NOT EXISTS idx_graph_nodes_value ON graph_nodes(value);
`;

declare global {
  // eslint-disable-next-line no-var
  var __rakshakDb: SQLiteDatabase | undefined;
}

function createDatabase(): SQLiteDatabase {
  fs.mkdirSync(path.dirname(databasePath), { recursive: true });

  const database = new Database(databasePath);
  database.pragma("journal_mode = WAL");
  database.pragma("foreign_keys = ON");
  database.exec(schema);
  return database;
}

export const db = globalThis.__rakshakDb ?? createDatabase();

if (process.env.NODE_ENV !== "production") {
  globalThis.__rakshakDb = db;
}

function parseJson<T>(value: string | null | undefined, fallback: T): T {
  if (!value) {
    return fallback;
  }

  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

interface IncidentRow {
  id: string;
  created_at: string;
  channel: Channel;
  raw_input: string | null;
  locale: string | null;
  scam_category: ScamCategory;
  threat_score: number;
  threat_level: ThreatLevel;
  score_breakdown: string | null;
  threat_signals: string | null;
  tactics: string | null;
  explanation: string | null;
  scammer_phone: string | null;
  scammer_upi: string | null;
  victim_city: string | null;
  victim_lat: number | null;
  victim_lng: number | null;
  feedback: FeedbackValue | null;
  complaint_filed: number;
}

function defaultBreakdown(): ScoreBreakdown {
  return { category: 0, tactics: 0, signals: 0, blocklist: 0, total: 0 };
}

function mapIncidentRow(row: IncidentRow): Incident {
  return {
    id: row.id,
    createdAt: row.created_at,
    channel: row.channel,
    rawInput: row.raw_input,
    locale: row.locale ?? "en",
    scamCategory: row.scam_category ?? "none",
    threatScore: row.threat_score,
    threatLevel: row.threat_level,
    scoreBreakdown: parseJson<ScoreBreakdown>(row.score_breakdown, defaultBreakdown()),
    threatSignals: parseJson<ThreatSignal[]>(row.threat_signals, []),
    tactics: parseJson<string[]>(row.tactics, []),
    explanation: row.explanation ?? "",
    scammerPhone: row.scammer_phone,
    scammerUpi: row.scammer_upi,
    victimCity: row.victim_city,
    victimLat: row.victim_lat,
    victimLng: row.victim_lng,
    feedback: row.feedback ?? "pending",
    complaintFiled: Boolean(row.complaint_filed),
  };
}

export interface IncidentListOptions {
  page?: number;
  pageSize?: number;
  level?: ThreatLevel;
  channel?: Channel;
  category?: ScamCategory;
  search?: string;
}

export interface IncidentListResult {
  incidents: Incident[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export function getIncidentById(id: string): Incident | null {
  const row = db.prepare("SELECT * FROM incidents WHERE id = ?").get(id) as IncidentRow | undefined;
  return row ? mapIncidentRow(row) : null;
}

export function listIncidents(options: IncidentListOptions = {}): IncidentListResult {
  const page = Math.max(1, options.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, options.pageSize ?? 25));
  const filters: string[] = [];
  const parameters: Record<string, string | number> = {
    limit: pageSize,
    offset: (page - 1) * pageSize,
  };

  if (options.level) {
    filters.push("threat_level = @level");
    parameters.level = options.level;
  }

  if (options.channel) {
    filters.push("channel = @channel");
    parameters.channel = options.channel;
  }

  if (options.category) {
    filters.push("scam_category = @category");
    parameters.category = options.category;
  }

  if (options.search?.trim()) {
    filters.push(
      "(raw_input LIKE @search OR scammer_phone LIKE @search OR scammer_upi LIKE @search OR victim_city LIKE @search)",
    );
    parameters.search = `%${options.search.trim()}%`;
  }

  const where = filters.length ? `WHERE ${filters.join(" AND ")}` : "";
  const countRow = db
    .prepare(`SELECT COUNT(*) AS count FROM incidents ${where}`)
    .get(parameters) as { count: number };
  const rows = db
    .prepare(
      `SELECT * FROM incidents ${where} ORDER BY datetime(created_at) DESC LIMIT @limit OFFSET @offset`,
    )
    .all(parameters) as IncidentRow[];

  const total = Number(countRow.count ?? 0);
  return {
    incidents: rows.map(mapIncidentRow),
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

function ensureGraphNode(
  nodeType: FraudGraphNode["nodeType"],
  value: string,
  city: string | null,
): string {
  const existing = db
    .prepare("SELECT id FROM graph_nodes WHERE value = ?")
    .get(value) as { id: string } | undefined;

  if (existing) {
    db.prepare(
      "UPDATE graph_nodes SET incident_count = incident_count + 1, city = COALESCE(?, city) WHERE id = ?",
    ).run(city, existing.id);
    return existing.id;
  }

  const id = randomUUID();
  db.prepare(
    "INSERT INTO graph_nodes (id, node_type, value, city) VALUES (?, ?, ?, ?)",
  ).run(id, nodeType, value, city);
  return id;
}

function addGraphEdge(
  sourceNodeId: string,
  targetNodeId: string,
  relationship: string,
  incidentId: string,
): void {
  db.prepare(
    "INSERT INTO graph_edges (id, source_node_id, target_node_id, relationship, incident_id) VALUES (?, ?, ?, ?, ?)",
  ).run(randomUUID(), sourceNodeId, targetNodeId, relationship, incidentId);
}

function syncIncidentGraph(analysis: ScoredAnalysis, incidentId: string): void {
  const city = analysis.victimCity ?? null;
  const phoneNode = analysis.scammerPhone
    ? ensureGraphNode("scammer_phone", analysis.scammerPhone, city)
    : null;
  const upiNode = analysis.scammerUpi
    ? ensureGraphNode("scammer_upi", analysis.scammerUpi, city)
    : null;
  const victimNode = city
    ? ensureGraphNode("victim", `victim:${incidentId}`, city)
    : null;

  if (phoneNode && upiNode) {
    addGraphEdge(phoneNode, upiNode, "uses", incidentId);
  }

  if (phoneNode && victimNode) {
    addGraphEdge(phoneNode, victimNode, "targeted", incidentId);
  }

  if (upiNode && victimNode) {
    addGraphEdge(upiNode, victimNode, "received_from", incidentId);
  }
}

export function insertIncident(
  analysis: ScoredAnalysis,
  options: { locale?: string; rawInput?: string } = {},
): Incident {
  const id = analysis.id ?? randomUUID();
  const createdAt = new Date().toISOString();
  const insert = db.prepare(`
    INSERT INTO incidents (
      id, created_at, channel, raw_input, locale, scam_category, threat_score,
      threat_level, score_breakdown, threat_signals, tactics, explanation,
      scammer_phone, scammer_upi, victim_city, victim_lat, victim_lng, feedback, complaint_filed
    ) VALUES (
      @id, @createdAt, @channel, @rawInput, @locale, @scamCategory, @threatScore,
      @threatLevel, @scoreBreakdown, @threatSignals, @tactics, @explanation,
      @scammerPhone, @scammerUpi, @victimCity, @victimLat, @victimLng, 'pending', 0
    )
  `);

  const transaction = db.transaction(() => {
    insert.run({
      id,
      createdAt,
      channel: analysis.channel,
      rawInput: options.rawInput ?? analysis.rawInput ?? null,
      locale: options.locale ?? analysis.detectedLanguage ?? "en",
      scamCategory: analysis.scamCategory,
      threatScore: analysis.threatScore,
      threatLevel: analysis.threatLevel,
      scoreBreakdown: JSON.stringify(analysis.scoreBreakdown),
      threatSignals: JSON.stringify(analysis.threatSignals),
      tactics: JSON.stringify(analysis.psychologicalTactics),
      explanation: analysis.explanationForVictim,
      scammerPhone: analysis.scammerPhone ?? null,
      scammerUpi: analysis.scammerUpi ?? null,
      victimCity: analysis.victimCity ?? null,
      victimLat: analysis.victimLat ?? null,
      victimLng: analysis.victimLng ?? null,
    });

    syncIncidentGraph(analysis, id);
  });

  transaction();
  const incident = getIncidentById(id);

  if (!incident) {
    throw new Error("Incident was inserted but could not be loaded.");
  }

  return incident;
}

export function updateIncidentFeedback(id: string, feedback: FeedbackValue): Incident | null {
  db.prepare("UPDATE incidents SET feedback = ? WHERE id = ?").run(feedback, id);
  return getIncidentById(id);
}

export function markComplaintFiled(id: string): Incident | null {
  db.prepare("UPDATE incidents SET complaint_filed = 1 WHERE id = ?").run(id);
  return getIncidentById(id);
}

export function getGraphData(): FraudGraphData {
  const nodes = db
    .prepare("SELECT id, node_type, value, first_seen, incident_count, city FROM graph_nodes ORDER BY incident_count DESC")
    .all() as Array<{
    id: string;
    node_type: FraudGraphNode["nodeType"];
    value: string;
    first_seen: string;
    incident_count: number;
    city: string | null;
  }>;
  const edges = db
    .prepare(
      "SELECT id, source_node_id, target_node_id, relationship, incident_id, created_at FROM graph_edges ORDER BY datetime(created_at) DESC",
    )
    .all() as Array<{
    id: string;
    source_node_id: string;
    target_node_id: string;
    relationship: string;
    incident_id: string | null;
    created_at: string;
  }>;

  return {
    nodes: nodes.map((node) => ({
      id: node.id,
      nodeType: node.node_type,
      value: node.value,
      firstSeen: node.first_seen,
      incidentCount: node.incident_count,
      city: node.city,
    })),
    edges: edges.map((edge) => ({
      id: edge.id,
      sourceNodeId: edge.source_node_id,
      targetNodeId: edge.target_node_id,
      relationship: edge.relationship,
      incidentId: edge.incident_id,
      createdAt: edge.created_at,
    })),
  };
}

export function getMapIncidentPoints(): MapIncidentPoint[] {
  const rows = db
    .prepare(
      `SELECT id, victim_city, victim_lat, victim_lng, threat_score, threat_level, scam_category
       FROM incidents
       WHERE victim_city IS NOT NULL AND victim_lat IS NOT NULL AND victim_lng IS NOT NULL
       ORDER BY datetime(created_at) DESC`,
    )
    .all() as Array<{
    id: string;
    victim_city: string;
    victim_lat: number;
    victim_lng: number;
    threat_score: number;
    threat_level: ThreatLevel;
    scam_category: ScamCategory;
  }>;

  return rows.map((row) => ({
    id: row.id,
    city: row.victim_city,
    lat: row.victim_lat,
    lng: row.victim_lng,
    threatScore: row.threat_score,
    threatLevel: row.threat_level,
    category: row.scam_category,
  }));
}

export function getDashboardStats(): DashboardStats {
  const count = (query: string, parameters?: Record<string, string | number>): number => {
    const row = db.prepare(query).get(parameters) as { count: number };
    return Number(row.count ?? 0);
  };

  const averageRow = db
    .prepare("SELECT COALESCE(AVG(threat_score), 0) AS average FROM incidents")
    .get() as { average: number };
  const levelRows = db
    .prepare("SELECT threat_level, COUNT(*) AS count FROM incidents GROUP BY threat_level")
    .all() as Array<{ threat_level: ThreatLevel; count: number }>;
  const categoryRows = db
    .prepare("SELECT scam_category, COUNT(*) AS count FROM incidents GROUP BY scam_category")
    .all() as Array<{ scam_category: string; count: number }>;
  const cityRows = db
    .prepare(
      "SELECT COALESCE(victim_city, 'Unknown') AS city, COUNT(*) AS count FROM incidents GROUP BY victim_city ORDER BY count DESC",
    )
    .all() as Array<{ city: string; count: number }>;

  const levelCounts = { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 };
  for (const row of levelRows) {
    levelCounts[row.threat_level] = Number(row.count);
  }

  return {
    totalIncidents: count("SELECT COUNT(*) AS count FROM incidents"),
    incidentsToday: count("SELECT COUNT(*) AS count FROM incidents WHERE date(created_at) = date('now')"),
    criticalToday: count(
      "SELECT COUNT(*) AS count FROM incidents WHERE threat_level = 'CRITICAL' AND date(created_at) = date('now')",
    ),
    highRiskOpen: count(
      "SELECT COUNT(*) AS count FROM incidents WHERE threat_level IN ('HIGH', 'CRITICAL') AND complaint_filed = 0",
    ),
    complaintsFiled: count("SELECT COUNT(*) AS count FROM incidents WHERE complaint_filed = 1"),
    averageThreatScore: Math.round(Number(averageRow.average ?? 0)),
    levelCounts,
    categoryCounts: Object.fromEntries(
      categoryRows.map((row) => [row.scam_category, Number(row.count)]),
    ),
    cityCounts: Object.fromEntries(cityRows.map((row) => [row.city, Number(row.count)])),
  };
}

export function getRawAnalysisForIncident(id: string): AnalysisResult | null {
  const incident = getIncidentById(id);
  if (!incident) {
    return null;
  }

  return {
    id: incident.id,
    channel: incident.channel,
    rawInput: incident.rawInput ?? undefined,
    detectedLanguage: incident.locale,
    scamCategory: incident.scamCategory,
    threatSignals: incident.threatSignals,
    psychologicalTactics: incident.tactics,
    overallRisk: incident.threatScore,
    confidence: 0,
    reasoning: incident.explanation,
    explanationForVictim: incident.explanation,
    scammerPhone: incident.scammerPhone ?? undefined,
    scammerUpi: incident.scammerUpi ?? undefined,
    victimCity: incident.victimCity ?? undefined,
    victimLat: incident.victimLat ?? undefined,
    victimLng: incident.victimLng ?? undefined,
  };
}

