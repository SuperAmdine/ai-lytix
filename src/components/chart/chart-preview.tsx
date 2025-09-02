"use client";

import CategoricalBar from "./categorical-bar";
import TimeseriesLine from "./time-series-line";

type PreviewData =
  | { kind: "timeseries"; points: { x: string | Date; y: number }[] }
  | { kind: "categorical"; buckets: { label: string; value: number }[] };

export default function ChartPreview({
  data,
  fallbackText = "Preview will appear here",
}: {
  data?: PreviewData | null;
  fallbackText?: string;
}) {
  if (!data) {
    return (
      <div className="h-48 rounded-md border flex items-center justify-center text-muted-foreground text-sm">
        {fallbackText}
      </div>
    );
  }
  if (data.kind === "timeseries")
    return <TimeseriesLine points={data.points} />;
  if (data.kind === "categorical")
    return <CategoricalBar buckets={data.buckets} />;
  return (
    <div className="h-48 rounded-md border flex items-center justify-center text-muted-foreground text-sm">
      Unsupported preview
    </div>
  );
}
