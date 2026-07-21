import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";

import { seedBlocklistEntries } from "../lib/blocklist";
import { db } from "../lib/db";
import type { Channel, FeedbackValue, GraphNodeType, ScamCategory, ThreatLevel, ThreatSignal } from "../lib/types";

interface SeedIncident {
  id: string;
  created_at: string;
  channel: Channel;
  raw_input: string;
  locale: string;
  scam_category: ScamCategory;
  threat_score: number;
  threat_level: ThreatLevel;
  score_breakdown: Record<string, number>;
  threat_signals: ThreatSignal[];
  tactics: string[];
  explanation: string;
  scammer_phone: string | null;
  scammer_upi: string | null;
  victim_city: string | null;
  victim_lat: number | null;
  victim_lng: number | null;
  feedback: FeedbackValue;
  complaint_filed: number;
}

function readJson<T>(fileName: string): T {
  const filePath = path.join(process.cwd(), "data", fileName);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Missing seed file: ${filePath}`);
  }
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
}

function ensureGraphNode(nodeType: GraphNodeType, value: string, city: string | null): string {
  const existing = db.prepare("SELECT id FROM graph_nodes WHERE value = ?").get(value) as { id: string } | undefined;
  if (existing) return existing.id;

  const id = randomUUID();
  db.prepare("INSERT INTO graph_nodes (id, node_type, value, city) VALUES (?, ?, ?, ?)").run(id, nodeType, value, city);
  return id;
}

function addGraphEdge(source: string, target: string, relationship: string, incidentId: string): void {
  db.prepare("INSERT INTO graph_edges (id, source_node_id, target_node_id, relationship, incident_id) VALUES (?, ?, ?, ?, ?)").run(randomUUID(), source, target, relationship, incidentId);
}

function addIncidentGraph(incident: SeedIncident): void {
  const phoneNode = incident.scammer_phone ? ensureGraphNode("scammer_phone", incident.scammer_phone, incident.victim_city) : null;
  const upiNode = incident.scammer_upi ? ensureGraphNode("scammer_upi", incident.scammer_upi, incident.victim_city) : null;
  const victimNode = incident.victim_city ? ensureGraphNode("victim", `victim:${incident.id}`, incident.victim_city) : null;

  if (phoneNode && upiNode) addGraphEdge(phoneNode, upiNode, "uses", incident.id);
  if (phoneNode && victimNode) addGraphEdge(phoneNode, victimNode, "targeted", incident.id);
  if (upiNode && victimNode) addGraphEdge(upiNode, victimNode, "received_from", incident.id);
}

const incidents = readJson<SeedIncident[]>("seed-incidents.json");
const blocklistCount = seedBlocklistEntries();
const insert = db.prepare(`
  INSERT INTO incidents (
    id, created_at, channel, raw_input, locale, scam_category, threat_score,
    threat_level, score_breakdown, threat_signals, tactics, explanation,
    scammer_phone, scammer_upi, victim_city, victim_lat, victim_lng, feedback, complaint_filed
  ) VALUES (
    @id, @createdAt, @channel, @rawInput, @locale, @scamCategory, @threatScore,
    @threatLevel, @scoreBreakdown, @threatSignals, @tactics, @explanation,
    @scammerPhone, @scammerUpi, @victimCity, @victimLat, @victimLng, @feedback, @complaintFiled
  )
`);

let insertedCount = 0;
const seedTransaction = db.transaction(() => {
  for (const incident of incidents) {
    const alreadySeeded = db.prepare("SELECT id FROM incidents WHERE id = ?").get(incident.id) as { id: string } | undefined;
    if (alreadySeeded) continue;

    insert.run({
      id: incident.id,
      createdAt: incident.created_at,
      channel: incident.channel,
      rawInput: incident.raw_input,
      locale: incident.locale,
      scamCategory: incident.scam_category,
      threatScore: incident.threat_score,
      threatLevel: incident.threat_level,
      scoreBreakdown: JSON.stringify(incident.score_breakdown),
      threatSignals: JSON.stringify(incident.threat_signals),
      tactics: JSON.stringify(incident.tactics),
      explanation: incident.explanation,
      scammerPhone: incident.scammer_phone,
      scammerUpi: incident.scammer_upi,
      victimCity: incident.victim_city,
      victimLat: incident.victim_lat,
      victimLng: incident.victim_lng,
      feedback: incident.feedback ?? "pending",
      complaintFiled: incident.complaint_filed ? 1 : 0,
    });
    addIncidentGraph(incident);
    insertedCount += 1;
  }
});

seedTransaction();
console.log(`Seeded ${insertedCount} new incidents and ${blocklistCount} blocklist entries.`);
console.log(`Database: ${path.join(process.cwd(), "data", "rakshak.sqlite")}`);

