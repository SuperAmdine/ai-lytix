"use client";

export default function ReportGrid({
  items,
}: {
  items: Array<{
    id: string;
    title: string;
    viz_type: "line" | "bar" | "table";
    width: number;
    height: number;
    spec: any;
  }>;
}) {
  return (
    <div
      className="grid gap-4"
      style={{
        gridTemplateColumns: "repeat(12, minmax(0, 1fr))",
        gridAutoRows: "120px",
      }}
    >
      {items.map((c) => (
        <div
          key={c.id}
          className="border rounded-xl p-3 bg-white"
          style={{
            gridColumn: `span ${Math.min(12, Math.max(1, c.width))} / span ${Math.min(
              12,
              Math.max(1, c.width),
            )}`,
            gridRow: `span ${Math.max(1, c.height)} / span ${Math.max(1, c.height)}`,
          }}
        >
          <div className="text-sm font-medium mb-2">{c.title}</div>
          <SavedChart spec={c.spec} />
        </div>
      ))}
    </div>
  );
}

import SavedChart from "@/components/chart/saved-chart";