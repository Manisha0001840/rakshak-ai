import { NextResponse } from "next/server";

import { getIncidentById, getRawAnalysisForIncident } from "../../../lib/db";
import { generateComplaint, GeminiError } from "../../../lib/gemini";
import type { AnalysisResult, ScoredAnalysis } from "../../../lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      incidentId?: unknown;
      analysis?: unknown;
    };
    const incidentId = typeof body.incidentId === "string" ? body.incidentId.trim() : "";
    let analysis: AnalysisResult | ScoredAnalysis | null = null;

    if (incidentId) {
      if (!getIncidentById(incidentId)) {
        return NextResponse.json({ error: "Incident not found." }, { status: 404 });
      }
      analysis = getRawAnalysisForIncident(incidentId);
    } else if (isObject(body.analysis)) {
      analysis = body.analysis as unknown as AnalysisResult | ScoredAnalysis;
    }

    if (!analysis) {
      return NextResponse.json({ error: "An incident ID or analysis result is required." }, { status: 400 });
    }

    const complaint = await generateComplaint(analysis);
    return NextResponse.json({
      success: true,
      data: {
        complaint,
        incidentId: incidentId || undefined,
      },
    });
  } catch (error) {
    if (error instanceof GeminiError) {
      return NextResponse.json({ error: error.message }, { status: 502 });
    }

    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
    }

    console.error("Complaint route failed:", error);
    return NextResponse.json({ error: "Unable to generate a complaint draft right now." }, { status: 500 });
  }
}
