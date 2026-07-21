import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";

import { db } from "./db";
import type { BlocklistMatch } from "./types";

export interface BlocklistEntry extends BlocklistMatch {
  id?: string;
  createdAt?: string;
}

interface RawBlocklistEntry {
  id?: unknown;
  entry_type?: unknown;
  entryType?: unknown;
  value?: unknown;
  reported_count?: unknown;
  reportedCount?: unknown;
  source?: unknown;
  created_at?: unknown;
  createdAt?: unknown;
}

const blocklistPath = path.join(process.cwd(), "data", "blocklist.json");

export function normalizePhone(value: string): string {
  const digits = value.replace(/\D/g, "");

  if (digits.startsWith("0091") && digits.length >= 14) {
    return `+91${digits.slice(4)}`;
  }

  if (digits.startsWith("91") && digits.length === 12) {
    return `+${digits}`;
  }

  if (digits.length === 10) {
    return `+91${digits}`;
  }

  return value.trim().replace(/[()\s-]/g, "");
}

export function normalizeUpi(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, "");
}

export function normalizeIdentifier(type: "phone" | "upi", value: string): string {
  return type === "phone" ? normalizePhone(value) : normalizeUpi(value);
}

function parseEntry(entry: RawBlocklistEntry): BlocklistEntry | null {
  const rawType = entry.entry_type ?? entry.entryType;
  const rawValue = entry.value;

  if ((rawType !== "phone" && rawType !== "upi") || typeof rawValue !== "string" || !rawValue.trim()) {
    return null;
  }

  const entryType = rawType as "phone" | "upi";
  const reportedCount = Number(entry.reported_count ?? entry.reportedCount ?? 1);

  return {
    id: typeof entry.id === "string" ? entry.id : undefined,
    entryType,
    value: normalizeIdentifier(entryType, rawValue),
    reportedCount: Number.isFinite(reportedCount) ? reportedCount : 1,
    source: typeof entry.source === "string" ? entry.source : "seed",
    createdAt:
      typeof entry.created_at === "string"
        ? entry.created_at
        : typeof entry.createdAt === "string"
          ? entry.createdAt
          : undefined,
  };
}

function readSeedEntries(): BlocklistEntry[] {
  if (!fs.existsSync(blocklistPath)) {
    return [];
  }

  try {
    const parsed = JSON.parse(fs.readFileSync(blocklistPath, "utf8")) as unknown;
    const entries = Array.isArray(parsed)
      ? parsed
      : parsed && typeof parsed === "object" && "entries" in parsed
        ? (parsed as { entries: unknown[] }).entries
        : [];

    return entries
      .filter((entry): entry is RawBlocklistEntry => Boolean(entry && typeof entry === "object"))
      .map(parseEntry)
      .filter((entry): entry is BlocklistEntry => Boolean(entry));
  } catch {
    return [];
  }
}

function readDatabaseEntries(): BlocklistEntry[] {
  try {
    const rows = db
      .prepare(
        "SELECT id, entry_type, value, reported_count, source, created_at FROM blocklist ORDER BY reported_count DESC",
      )
      .all() as Array<{
      id: string;
      entry_type: "phone" | "upi";
      value: string;
      reported_count: number;
      source: string;
      created_at: string;
    }>;

    return rows.map((row) => ({
      id: row.id,
      entryType: row.entry_type,
      value: normalizeIdentifier(row.entry_type, row.value),
      reportedCount: row.reported_count,
      source: row.source,
      createdAt: row.created_at,
    }));
  } catch {
    return [];
  }
}

export function getBlocklistEntries(): BlocklistEntry[] {
  const merged = new Map<string, BlocklistEntry>();

  for (const entry of [...readSeedEntries(), ...readDatabaseEntries()]) {
    const key = `${entry.entryType}:${entry.value}`;
    const existing = merged.get(key);

    if (!existing || (entry.reportedCount ?? 0) > (existing.reportedCount ?? 0)) {
      merged.set(key, entry);
    }
  }

  return Array.from(merged.values()).sort((a, b) => (b.reportedCount ?? 0) - (a.reportedCount ?? 0));
}

export function findBlocklistMatches(
  identifiers: { phone?: string | null; upi?: string | null },
): BlocklistMatch[] {
  const normalizedPhone = identifiers.phone ? normalizePhone(identifiers.phone) : null;
  const normalizedUpi = identifiers.upi ? normalizeUpi(identifiers.upi) : null;
  const matches: BlocklistMatch[] = [];

  for (const entry of getBlocklistEntries()) {
    const matched =
      (entry.entryType === "phone" && normalizedPhone === entry.value) ||
      (entry.entryType === "upi" && normalizedUpi === entry.value);

    if (matched) {
      matches.push({
        entryType: entry.entryType,
        value: entry.value,
        reportedCount: entry.reportedCount,
        source: entry.source,
      });
    }
  }

  return matches;
}

export function extractPotentialIdentifiers(text: string): { phones: string[]; upis: string[] } {
  const phones = Array.from(text.matchAll(/(?:\+?91[\s-]?)?[6-9]\d{9}\b/g)).map((match) => normalizePhone(match[0]));
  const upis = Array.from(text.matchAll(/\b[a-zA-Z0-9][a-zA-Z0-9._-]{1,80}@[a-zA-Z][a-zA-Z0-9._-]{1,40}\b/g)).map((match) =>
    normalizeUpi(match[0]),
  );

  return {
    phones: Array.from(new Set(phones)),
    upis: Array.from(new Set(upis)),
  };
}

export function findBlocklistMatchesInText(text: string): BlocklistMatch[] {
  const identifiers = extractPotentialIdentifiers(text);
  const matches: BlocklistMatch[] = [];

  for (const phone of identifiers.phones) {
    matches.push(...findBlocklistMatches({ phone }));
  }

  for (const upi of identifiers.upis) {
    matches.push(...findBlocklistMatches({ upi }));
  }

  return Array.from(new Map(matches.map((match) => [`${match.entryType}:${match.value}`, match])).values());
}

export function seedBlocklistEntries(entries: BlocklistEntry[] = readSeedEntries()): number {
  const insert = db.prepare(`
    INSERT INTO blocklist (id, entry_type, value, reported_count, source)
    VALUES (@id, @entryType, @value, @reportedCount, @source)
    ON CONFLICT(value) DO UPDATE SET
      reported_count = excluded.reported_count,
      source = excluded.source
  `);

  const transaction = db.transaction(() => {
    for (const entry of entries) {
      insert.run({
        id: entry.id ?? randomUUID(),
        entryType: entry.entryType,
        value: normalizeIdentifier(entry.entryType, entry.value),
        reportedCount: entry.reportedCount ?? 1,
        source: entry.source ?? "seed",
      });
    }
  });

  transaction();
  return entries.length;
}
