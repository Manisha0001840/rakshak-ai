import { NextResponse } from "next/server";

import { findBlocklistMatches, findBlocklistMatchesInText, extractPotentialIdentifiers } from "../../../../lib/blocklist";
import { db, insertIncident } from "../../../../lib/db";
import { analyzeAudio, GeminiError } from "../../../../lib/gemini";
import { scoreAnalysis } from "../../../../lib/scoring";
import type { BlocklistMatch } from "../../../../lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_AUDIO_BYTES = 15 * 1024 * 1024;

function asOptionalString(value: FormDataEntryValue | null): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function asOptionalNumber(value: FormDataEntryValue | null): number | undefined {
  const normalized = typeof value === "string" ? Number(value) : Number.NaN;
  return Number.isFinite(normalized) ? normalized : undefined;
}

function mergeMatches(matches: BlocklistMatch[]): BlocklistMatch[] {
  return [...new Map(matches.map((match) => [`${match.entryType}:${match.value}`, match])).values()];
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const fileEntry = formData.get("file") ?? formData.get("audio");

    if (!fileEntry || typeof fileEntry === "string" || typeof fileEntry.arrayBuffer !== "function") {
      return NextResponse.json({ error: "Attach an audio file using the file field." }, { status: 400 });
    }

    if (fileEntry.size === 0) {
      return NextResponse.json({ error: "The uploaded audio file is empty." }, { status: 400 });
    }

    if (fileEntry.size > MAX_AUDIO_BYTES) {
      return NextResponse.json({ error: "Audio files must be 15 MB or smaller." }, { status: 413 });
    }

    const mimeType = fileEntry.type?.startsWith("audio/") ? fileEntry.type : "audio/webm";
    const localeHint = asOptionalString(formData.get("locale")) ?? "auto";
    const bytes = Buffer.from(await fileEntry.arrayBuffer());
    const aiAnalysis = await analyzeAudio(bytes, mimeType, localeHint);
    const transcript = aiAnalysis.transcript ?? aiAnalysis.transcriptEnglish ?? "";
    const extracted = extractPotentialIdentifiers(transcript);
    const scammerPhone = aiAnalysis.scammerPhone ?? extracted.phones[0];
    const scammerUpi = aiAnalysis.scammerUpi ?? extracted.upis[0];
    const matches = mergeMatches([
      ...findBlocklistMatches({ phone: scammerPhone, upi: scammerUpi }),
      ...findBlocklistMatchesInText(transcript),
    ]);

    const analysis = scoreAnalysis(
      {
        ...aiAnalysis,
        scammerPhone,
        scammerUpi,
        victimCity: asOptionalString(formData.get("victimCity")) ?? aiAnalysis.victimCity,
        victimLat: asOptionalNumber(formData.get("victimLat")) ?? aiAnalysis.victimLat,
        victimLng: asOptionalNumber(formData.get("victimLng")) ?? aiAnalysis.victimLng,
      },
      matches,
    );
    const incident = insertIncident(analysis, {
      locale: aiAnalysis.detectedLanguage,
      rawInput: transcript || `[Audio upload: ${fileEntry.name || "recording"}]`,
    });

    return NextResponse.json({
      success: true,
      data: {
        analysis,
        incident,
        fileName: fileEntry.name || "recording",
      },
    });
  } catch (error) {
    if (error instanceof GeminiError) {
      return NextResponse.json({ error: error.message }, { status: 502 });
    }

    if (error instanceof Error && error.message.includes("SQLITE")) {
      return NextResponse.json({ error: "The audio incident could not be stored." }, { status: 500 });
    }

    void db;
    console.error("Audio analysis route failed:", error);
    return NextResponse.json(
      { error: "Unable to analyze this recording right now. Please try again." },
      { status: 500 },
    );
  }
}
