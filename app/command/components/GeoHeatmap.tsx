"use client";

import { useEffect, useRef } from "react";
import { CircleHelp, MapPinned } from "lucide-react";

import type { MapIncidentPoint, ThreatLevel } from "../../../lib/types";

interface GeoHeatmapProps {
  points: MapIncidentPoint[];
  isLoading: boolean;
}

const levelColors: Record<ThreatLevel, string> = {
  LOW: "#22c55e",
  MEDIUM: "#f59e0b",
  HIGH: "#f97316",
  CRITICAL: "#ef4444",
};

function escapeHtml(value: string): string {
  return value.replace(/[&<>'"]/g, (character) => {
    const entities: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" };
    return entities[character];
  });
}

function titleCase(value: string): string {
  return value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default function GeoHeatmap({ points, isLoading }: GeoHeatmapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mapContainerRef.current || isLoading || points.length === 0) return;

    let disposed = false;
    let map: import("leaflet").Map | null = null;

    void (async () => {
      const leafletModule = await import("leaflet");
      await import("leaflet.heat");
      if (disposed || !mapContainerRef.current) return;

      const L = leafletModule.default;
      map = L.map(mapContainerRef.current, { zoomControl: false, attributionControl: true }).setView([22.5, 79], 4.5);
      L.control.zoom({ position: "bottomright" }).addTo(map);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
        maxZoom: 18,
      }).addTo(map);

      const heatLayerFactory = (L as unknown as {
        heatLayer: (coordinates: Array<[number, number, number]>, options: Record<string, unknown>) => import("leaflet").Layer;
      }).heatLayer;
      if (heatLayerFactory) {
        heatLayerFactory(
          points.map((point) => [point.lat, point.lng, Math.max(0.2, point.threatScore / 100)]),
          {
            radius: 34,
            blur: 26,
            maxZoom: 7,
            gradient: { 0.2: "#3b82f6", 0.45: "#8b5cf6", 0.65: "#f59e0b", 0.82: "#f97316", 1: "#ef4444" },
          },
        ).addTo(map);
      }

      for (const point of points) {
        const color = levelColors[point.threatLevel];
        L.circleMarker([point.lat, point.lng], {
          radius: Math.max(5, Math.min(10, 4 + point.threatScore / 18)),
          color,
          fillColor: color,
          fillOpacity: 0.82,
          weight: 1.5,
        }).addTo(map).bindPopup(`
          <div style="min-width: 150px">
            <strong>${escapeHtml(point.city)}</strong><br />
            <span>${escapeHtml(titleCase(point.category))}</span><br />
            <span>Threat score: ${point.threatScore} · ${escapeHtml(point.threatLevel)}</span>
          </div>
        `);
      }

      window.setTimeout(() => map?.invalidateSize(), 100);
    })();

    return () => {
      disposed = true;
      map?.remove();
      map = null;
    };
  }, [isLoading, points]);

  if (isLoading) {
    return <div className="flex h-[24rem] animate-pulse items-center justify-center rounded-2xl bg-white/[0.03] text-xs text-slate-600">Loading geographic activity...</div>;
  }

  if (points.length === 0) {
    return <div className="flex h-[24rem] flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/[0.02] text-center"><CircleHelp className="h-7 w-7 text-slate-600" /><p className="mt-3 text-sm text-slate-400">No location data yet.</p><p className="mt-1 max-w-xs text-xs leading-5 text-slate-600">Incidents with a city and coordinates will appear as heat clusters.</p></div>;
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#101827]">
      <div ref={mapContainerRef} className="h-[24rem] w-full" aria-label="India complaint heatmap" />
      <div className="pointer-events-none absolute left-3 top-3 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-black/35 px-3 py-2 text-[10px] text-slate-300 backdrop-blur-md"><MapPinned className="h-3.5 w-3.5 text-blue-300" />Incident density · hover clusters</div>
      <div className="pointer-events-none absolute bottom-3 left-3 flex gap-3 rounded-xl border border-white/10 bg-black/35 px-3 py-2 text-[10px] text-slate-500 backdrop-blur-md"><span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-blue-400" />Lower</span><span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-amber-400" />Medium</span><span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-red-400" />Critical</span></div>
    </div>
  );
}
