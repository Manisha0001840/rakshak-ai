import { NextResponse } from "next/server";

import { findBlocklistMatches } from "../../../../lib/blocklist";
import { db, insertIncident } from "../../../../lib/db";
import { analyzeImage, GeminiError } from "../../../../lib/gemini";
import { scoreAnalysis } from "../../../../lib/scoring";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const supportedImageTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

function asOptionalString(value: FormDataEntryValue | null): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function asOptionalNumber(value: FormDataEntryValue | null): number | undefined {
  const normalized = typeof value === "string" ? Number(value) : Number.NaN;
  return Number.isFinite(normalized) ? normalized : undefined;
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const fileEntry = formData.get("file") ?? formData.get("image");

    if (!fileEntry || typeof fileEntry === "string" || typeof fileEntry.arrayBuffer !== "function") {
      return NextResponse.json({ error: "Attach an image using the file field." }, { status: 400 });
    }

    if (fileEntry.size === 0) {
      return NextResponse.json({ error: "The uploaded image is empty." }, { status: 400 });
    }

    if (fileEntry.size > MAX_IMAGE_BYTES) {
      return NextResponse.json({ error: "Images must be 10 MB or smaller." }, { status: 413 });
    }

    if (!supportedImageTypes.has(fileEntry.type)) {
      return NextResponse.json(
        { error: "Use a JPEG, PNG, WebP, or GIF image." },
        { status: 415 },
      );
    }

    const bytes = Buffer.from(await fileEntry.arrayBuffer());
    const aiAnalysis = await analyzeImage(bytes, fileEntry.type);
    const matches = findBlocklistMatches({
      phone: aiAnalysis.scammerPhone,
      upi: aiAnalysis.scammerUpi,
    });
    const analysis = scoreAnalysis(
      {
        ...aiAnalysis,
        victimCity: asOptionalString(formData.get("victimCity")) ?? aiAnalysis.victimCity,
        victimLat: asOptionalNumber(formData.get("victimLat")) ?? aiAnalysis.victimLat,
        victimLng: asOptionalNumber(formData.get("victimLng")) ?? aiAnalysis.victimLng,
      },
      matches,
    );
    const incident = insertIncident(analysis, {
      locale: aiAnalysis.detectedLanguage,
      rawInput: `[Image upload: ${fileEntry.name || "document"}]`,
    });

    return NextResponse.json({
      success: true,
      data: {
        analysis,
        incident,
        fileName: fileEntry.name || "document",
      },
    });
  } catch (error) {
    if (error instanceof GeminiError) {
      return NextResponse.json({ error: error.message }, { status: 502 });
    }

    if (error instanceof Error && error.message.includes("SQLITE")) {
      return NextResponse.json({ error: "The image incident could not be stored." }, { status: 500 });
    }

    void db;
    console.error("Image analysis route failed:", error);
    return NextResponse.json(
      { error: "Unable to analyze this document right now. Please try again." },
      { status: 500 },
    );
  }
}
