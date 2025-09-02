"use client";
import { useEffect, useState } from "react";
import ChartPreview from "@/components/chart/chart-preview";

type PreviewResp =
  | { data: { kind: "timeseries"; points: { x: string | Date; y: number }[] } }
  | { data: { kind: "categorical"; buckets: { label: string; value: number }[] } };

export default function SavedChart({
  spec,
  fallback = "Loading…",
}: {
  spec: any;
  fallback?: string;
}) {
  const [payload, setPayload] = useState<PreviewResp["data"] | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const r = await fetch("/api/charts/preview", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ spec }),
        });
        const j = await r.json();
        if (alive) setPayload(j?.data ?? null);
      } catch {
        if (alive) setPayload(null);
      }
    })();
    return () => {
      alive = false;
    };
  }, [spec]);

  if (!payload) {
    return (
      <div className="h-48 rounded-md border flex items-center justify-center text-muted-foreground text-sm">
        {fallback}
      </div>
    );
  }
  return <ChartPreview data={payload} />;
}