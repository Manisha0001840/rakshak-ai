import { NextResponse } from "next/server";

import { getDashboardStats, getMapIncidentPoints } from "../../../lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const stats = getDashboardStats();
    const mapPoints = getMapIncidentPoints();
    return NextResponse.json({ success: true, data: { stats, mapPoints } });
  } catch (error) {
    console.error("Stats route failed:", error);
    return NextResponse.json({ error: "Unable to load command-center statistics right now." }, { status: 500 });
  }
}
