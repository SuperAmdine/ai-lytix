"use client";

import { compactNumber, formatDateISO } from "@/lib/utils";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type Point = { x: string | Date; y: number };
export default function TimeseriesLine({
  points,
  yLabel,
}: {
  points: Point[];
  yLabel?: string;
}) {
  const data = points.map((p) => ({
    x: formatDateISO(p.x),
    y: Number(p.y ?? 0),
  }));
  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data} margin={{ top: 8, right: 12, bottom: 8, left: 8 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="x" tick={{ fontSize: 12 }} />
        <YAxis tickFormatter={compactNumber} width={56} />
        <Tooltip
          formatter={(value: any) => compactNumber(value as number)}
          labelFormatter={(l: any) => l}
          contentStyle={{ fontSize: 12 }}
        />
        <Line type="monotone" dataKey="y" dot={false} strokeWidth={2} />
      </LineChart>
    </ResponsiveContainer>
  );
}
