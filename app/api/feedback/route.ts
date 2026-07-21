import { NextResponse } from "next/server";

import { updateIncidentFeedback } from "../../../lib/db";
import type { FeedbackValue } from "../../../lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { incidentId?: unknown; feedback?: unknown };
    const incidentId = typeof body.incidentId === "string" ? body.incidentId.trim() : "";
    const feedback = body.feedback as FeedbackValue;

    if (!incidentId) {
      return NextResponse.json({ error: "An incident ID is required." }, { status: 400 });
    }

    if (feedback !== "scam" && feedback !== "not_scam") {
      return NextResponse.json({ error: "Feedback must be scam or not_scam." }, { status: 400 });
    }

    const incident = updateIncidentFeedback(incidentId, feedback);
    if (!incident) {
      return NextResponse.json({ error: "Incident not found." }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: { incident } });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
    }

    console.error("Feedback route failed:", error);
    return NextResponse.json({ error: "Unable to save feedback right now." }, { status: 500 });
  }
}
