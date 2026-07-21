"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowLeft, LayoutDashboard, Map, Network, RefreshCw, ShieldCheck } from "lucide-react";

import FraudGraph from "./components/FraudGraph";
import GeoHeatmap from "./components/GeoHeatmap";
import IncidentTable from "./components/IncidentTable";
import StatsBar from "./components/StatsBar";
import type { DashboardStats, FraudGraphData, Incident, MapIncidentPoint } from "../../lib/types";

interface StatsResponse {
  stats: DashboardStats;
  mapPoints: MapIncidentPoint[];
}

const emptyStats: DashboardStats = {
  totalIncidents: 0,
  incidentsToday: 0,
  criticalToday: 0,
  highRiskOpen: 0,
  complaintsFiled: 0,
  averageThreatScore: 0,
  levelCounts: { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 },
  categoryCounts: {},
  cityCounts: {},
};

export default function CommandPage() {
  const [stats, setStats] = useState<DashboardStats>(emptyStats);
  const [mapPoints, setMapPoints] = useState<MapIncidentPoint[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [graph, setGraph] = useState<FraudGraphData>({ nodes: [], edges: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const loadDashboard = useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      const [statsResponse, incidentsResponse, graphResponse] = await Promise.all([
        fetch("/api/stats", { cache: "no-store" }),
        fetch("/api/incidents?page=1&pageSize=50", { cache: "no-store" }),
        fetch("/api/graph", { cache: "no-store" }),
      ]);
      const statsPayload = (await statsResponse.json()) as { data?: StatsResponse; error?: string };
      const incidentsPayload = (await incidentsResponse.json()) as { data?: { incidents?: Incident[] }; error?: string };
      const graphPayload = (await graphResponse.json()) as { data?: FraudGraphData; error?: string };

      if (!statsResponse.ok || !incidentsResponse.ok || !graphResponse.ok) {
        throw new Error(statsPayload.error || incidentsPayload.error || graphPayload.error || "Dashboard data could not be loaded.");
      }

      if (statsPayload.data) {
        setStats(statsPayload.data.stats);
        setMapPoints(statsPayload.data.mapPoints);
      }
      setIncidents(incidentsPayload.data?.incidents ?? []);
      setGraph(graphPayload.data ?? { nodes: [], edges: [] });
      setLastUpdated(new Date());
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to load command-center data.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  return (
    <main className="min-h-screen px-4 pb-12 sm:px-6 lg:px-8">
      <header className="mx-auto flex w-full max-w-[1400px] items-center justify-between py-5">
        <Link href="/" className="focus-ring inline-flex items-center gap-3 rounded-xl">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-accent-gradient shadow-glow"><ShieldCheck className="h-5 w-5 text-white" /></span>
          <span><span className="block text-sm font-semibold tracking-[0.22em] text-white">RAKSHAK AI</span><span className="block text-[10px] uppercase tracking-[0.22em] text-slate-500">Command center</span></span>
        </Link>
        <div className="flex items-center gap-2 sm:gap-3">
          <span className="hidden items-center gap-2 text-xs text-slate-500 md:flex"><span className="h-2 w-2 rounded-full bg-emerald-400" />Monitoring active</span>
          <Link href="/citizen" className="focus-ring rounded-xl px-3 py-2 text-xs text-slate-400 transition hover:bg-white/5 hover:text-white">Citizen portal</Link>
          <Link href="/" className="focus-ring inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-slate-300 transition hover:bg-white/[0.08]"><ArrowLeft className="h-3.5 w-3.5" />Home</Link>
        </div>
      </header>

      <section className="mx-auto w-full max-w-[1400px] pt-7 sm:pt-12">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-violet-400/20 bg-violet-400/10 px-3 py-1.5 text-xs font-medium text-violet-200"><LayoutDashboard className="h-3.5 w-3.5" />Responder workspace</div>
            <h1 className="mt-5 text-4xl font-semibold tracking-[-0.055em] text-white sm:text-5xl">Command center</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-400">Prioritize high-risk incidents, trace connected identifiers, and see where reports are clustering across India.</p>
          </div>
          <div className="flex items-center gap-3">
            {lastUpdated && <span className="text-xs text-slate-600">Updated {lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>}
            <button type="button" onClick={() => void loadDashboard()} disabled={isLoading} className="focus-ring button-secondary inline-flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold disabled:opacity-50"><RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />Refresh</button>
          </div>
        </div>

        {error && <div className="mt-6 flex items-start gap-3 rounded-2xl border border-red-400/20 bg-red-400/[0.07] p-4 text-sm text-red-200" role="alert"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />{error}</div>}

        <div className="mt-8"><StatsBar stats={stats} isLoading={isLoading} /></div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <section className="glass-panel min-w-0 rounded-3xl p-5 sm:p-6">
            <div className="mb-5 flex items-center justify-between gap-3"><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-400/10 text-red-300"><Network className="h-5 w-5" /></span><div><h2 className="text-base font-semibold text-white">Fraud network graph</h2><p className="text-xs text-slate-500">Phone, UPI, and victim connections</p></div></div><span className="text-xs text-slate-600">{graph.nodes.length} nodes · {graph.edges.length} links</span></div>
            <FraudGraph data={graph} isLoading={isLoading} />
          </section>
          <section className="glass-panel min-w-0 rounded-3xl p-5 sm:p-6">
            <div className="mb-5 flex items-center justify-between gap-3"><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-400/10 text-blue-300"><Map className="h-5 w-5" /></span><div><h2 className="text-base font-semibold text-white">Complaint heatmap</h2><p className="text-xs text-slate-500">Reported activity by city</p></div></div><span className="text-xs text-slate-600">India</span></div>
            <GeoHeatmap points={mapPoints} isLoading={isLoading} />
          </section>
        </div>

        <section className="glass-panel mt-6 rounded-3xl p-5 sm:p-6">
          <div className="mb-5 flex items-end justify-between gap-4"><div><h2 className="text-base font-semibold text-white">Priority incidents</h2><p className="mt-1 text-xs text-slate-500">Newest reports with the highest response value</p></div><span className="text-xs text-slate-600">{incidents.length} loaded</span></div>
          <IncidentTable incidents={incidents} isLoading={isLoading} onRefresh={() => void loadDashboard()} />
        </section>
      </section>
    </main>
  );
}
