import { NextResponse } from "next/server";

import { getGraphData } from "../../../lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const graph = getGraphData();
    return NextResponse.json({ success: true, data: graph });
  } catch (error) {
    console.error("Fraud graph route failed:", error);
    return NextResponse.json({ error: "Unable to load the fraud network right now." }, { status: 500 });
  }
}
