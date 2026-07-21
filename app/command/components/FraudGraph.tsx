"use client";

import { useEffect, useRef, useState } from "react";
import cytoscape, { Core } from "cytoscape";
import { CircleHelp, MousePointer2 } from "lucide-react";

import type { FraudGraphData, GraphNodeType } from "../../../lib/types";

interface FraudGraphProps {
  data: FraudGraphData;
  isLoading: boolean;
}

interface SelectedNode {
  value: string;
  nodeType: GraphNodeType;
  incidentCount: number;
  city: string | null;
}

const nodeColors: Record<GraphNodeType, string> = {
  scammer_phone: "#ef4444",
  scammer_upi: "#f59e0b",
  victim: "#3b82f6",
  mule_account: "#a78bfa",
};

const nodeLabels: Record<GraphNodeType, string> = {
  scammer_phone: "Scammer phone",
  scammer_upi: "Scammer UPI",
  victim: "Victim",
  mule_account: "Mule account",
};

function formatNodeType(value: GraphNodeType): string {
  return nodeLabels[value] ?? value;
}

export default function FraudGraph({ data, isLoading }: FraudGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<Core | null>(null);
  const [selectedNode, setSelectedNode] = useState<SelectedNode | null>(null);

  useEffect(() => {
    if (!containerRef.current || isLoading || data.nodes.length === 0) return;

    cyRef.current?.destroy();
    const cy = cytoscape({
      container: containerRef.current,
      elements: {
        nodes: data.nodes.map((node) => ({
          data: {
            id: node.id,
            label: node.value,
            nodeType: node.nodeType,
            incidentCount: node.incidentCount,
            city: node.city,
          },
        })),
        edges: data.edges.map((edge) => ({
          data: {
            id: edge.id,
            source: edge.sourceNodeId,
            target: edge.targetNodeId,
            relationship: edge.relationship,
          },
        })),
      },
      style: [
        {
          selector: "node",
          style: {
            "background-color": (element) => nodeColors[element.data("nodeType") as GraphNodeType] ?? "#64748b",
            label: "data(label)",
            color: "#e2e8f0",
            "font-size": 9,
            "font-family": "Inter, sans-serif",
            "text-wrap": "ellipsis",
            "text-max-width": "95",
            "text-valign": "bottom",
            "text-margin-y": 8,
            "border-width": 2,
            "border-color": "#0f172a",
            width: "mapData(incidentCount, 1, 10, 26, 46)",
            height: "mapData(incidentCount, 1, 10, 26, 46)",
          },
        },
        {
          selector: "edge",
          style: {
            width: 1.5,
            "line-color": "#64748b",
            "target-arrow-color": "#64748b",
            "target-arrow-shape": "triangle",
            "curve-style": "bezier",
            opacity: 0.65,
          },
        },
        {
          selector: "node:selected",
          style: {
            "border-width": 4,
            "border-color": "#f8fafc",
            "overlay-color": "#ffffff",
            "overlay-opacity": 0.12,
          },
        },
      ],
      layout: {
        name: "cose",
        animate: true,
        animationDuration: 700,
        fit: true,
        padding: 36,
        nodeRepulsion: 9500,
        idealEdgeLength: 120,
      },
      minZoom: 0.35,
      maxZoom: 2.2,
    });

    cy.on("tap", "node", (event) => {
      const node = event.target.data();
      setSelectedNode({
        value: String(node.label),
        nodeType: node.nodeType as GraphNodeType,
        incidentCount: Number(node.incidentCount ?? 0),
        city: node.city ? String(node.city) : null,
      });
    });
    cy.on("tap", (event) => {
      if (event.target === cy) setSelectedNode(null);
    });

    cyRef.current = cy;
    return () => {
      cy.destroy();
      cyRef.current = null;
    };
  }, [data, isLoading]);

  if (isLoading) {
    return <div className="flex h-[24rem] animate-pulse items-center justify-center rounded-2xl bg-white/[0.03] text-xs text-slate-600">Building fraud network...</div>;
  }

  if (data.nodes.length === 0) {
    return <div className="flex h-[24rem] flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/[0.02] text-center"><CircleHelp className="h-7 w-7 text-slate-600" /><p className="mt-3 text-sm text-slate-400">No network links yet.</p><p className="mt-1 max-w-xs text-xs leading-5 text-slate-600">Analyze incidents with phone numbers, UPI IDs, or cities to build the graph.</p></div>;
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#080b14]">
      <div ref={containerRef} className="h-[24rem] w-full" aria-label="Interactive fraud network graph" />
      <div className="pointer-events-none absolute left-3 top-3 flex flex-wrap gap-2 rounded-xl border border-white/10 bg-black/30 px-3 py-2 backdrop-blur-md">
        {(Object.keys(nodeLabels) as GraphNodeType[]).map((type) => <span key={type} className="inline-flex items-center gap-1.5 text-[10px] text-slate-400"><span className="h-2 w-2 rounded-full" style={{ backgroundColor: nodeColors[type] }} />{nodeLabels[type]}</span>)}
      </div>
      <div className="pointer-events-none absolute bottom-3 left-3 inline-flex items-center gap-2 rounded-lg bg-black/30 px-2.5 py-1.5 text-[10px] text-slate-600 backdrop-blur-md"><MousePointer2 className="h-3 w-3" />Click a node to inspect it</div>
      {selectedNode && <div className="absolute bottom-3 right-3 max-w-[16rem] rounded-xl border border-white/10 bg-[#111827]/90 p-3 shadow-glass backdrop-blur-xl"><p className="text-[10px] uppercase tracking-[0.15em] text-slate-500">{formatNodeType(selectedNode.nodeType)}</p><p className="mt-1 break-all font-mono text-xs text-white">{selectedNode.value}</p><p className="mt-2 text-[11px] text-slate-500">{selectedNode.incidentCount} linked incident{selectedNode.incidentCount === 1 ? "" : "s"}{selectedNode.city ? ` · ${selectedNode.city}` : ""}</p></div>}
    </div>
  );
}
