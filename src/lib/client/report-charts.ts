import type { ChartSpec } from "@/types/chart-spec";

export async function addChartToReport(opts: {
  reportId: string;
  title: string;
  viz_type: "line" | "bar" | "table";
  spec: ChartSpec;
  position?: number;
  width?: number;
  height?: number;
}) {
  const res = await fetch(`/api/reports/${opts.reportId}/charts`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(opts),
  });
  if (!res.ok) {
    const j = await res.json().catch(() => ({}));
    throw new Error(j?.error || `Failed to add chart (${res.status})`);
  }
  return res.json();
}