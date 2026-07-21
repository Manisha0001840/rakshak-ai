import { NextResponse } from "next/server";

import { analyzeText, GeminiError } from "../../../../lib/gemini";
import {
  extractPotentialIdentifiers,
  findBlocklistMatches,
  findBlocklistMatchesInText,
} from "../../../../lib/blocklist";
import { db, insertIncident } from "../../../../lib/db";
import { scoreAnalysis } from "../../../../lib/scoring";
import type { BlocklistMatch } from "../../../../lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface TextAnalysisRequest {
  text?: unknown;
  locale?: unknown;
  victimCity?: unknown;
  victimLat?: unknown;
  victimLng?: unknown;
}

function asOptionalString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function asOptionalNumber(value: unknown): number | undefined {
  const normalized = typeof value === "number" ? value : Number(value);
  return Number.isFinite(normalized) ? normalized : undefined;
}

function mergeMatches(matches: BlocklistMatch[]): BlocklistMatch[] {
  return Array.from(new Map(matches.map((match) => [`${match.entryType}:${match.value}`, match])).values());
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as TextAnalysisRequest;
    const text = asOptionalString(body.text);

    if (!text) {
      return NextResponse.json({ error: "Paste a message to analyze." }, { status: 400 });
    }

    if (text.length > 20_000) {
      return NextResponse.json(
        { error: "The message is too long. Please submit no more than 20,000 characters." },
        { status: 413 },
      );
    }

    const localeHint = asOptionalString(body.locale) ?? "auto";
    const aiAnalysis = await analyzeText(text, localeHint);
    const extracted = extractPotentialIdentifiers(text);
    const scammerPhone = aiAnalysis.scammerPhone ?? extracted.phones[0];
    const scammerUpi = aiAnalysis.scammerUpi ?? extracted.upis[0];
    const matches = mergeMatches([
      ...findBlocklistMatches({ phone: scammerPhone, upi: scammerUpi }),
      ...findBlocklistMatchesInText(text),
    ]);

    const analysis = scoreAnalysis(
      {
        ...aiAnalysis,
        scammerPhone,
        scammerUpi,
        victimCity: asOptionalString(body.victimCity) ?? aiAnalysis.victimCity,
        victimLat: asOptionalNumber(body.victimLat) ?? aiAnalysis.victimLat,
        victimLng: asOptionalNumber(body.victimLng) ?? aiAnalysis.victimLng,
      },
      matches,
    );
    const incident = insertIncident(analysis, {
      locale: aiAnalysis.detectedLanguage,
      rawInput: text,
    });

    return NextResponse.json({
      success: true,
      data: {
        analysis,
        incident,
      },
    });
  } catch (error) {
    if (error instanceof GeminiError) {
      return NextResponse.json({ error: error.message }, { status: 502 });
    }

    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
    }

    if (error instanceof Error && error.message.includes("SQLITE")) {
      return NextResponse.json({ error: "The incident could not be stored." }, { status: 500 });
    }

    void db;
    console.error("Text analysis route failed:", error);
    return NextResponse.json(
      { error: "Unable to analyze this message right now. Please try again." },
      { status: 500 },
    );
  }
}
