"use client";

import { compactNumber } from "@/lib/utils";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type Bucket = { label: string; value: number };
export default function CategoricalBar({ buckets }: { buckets: Bucket[] }) {
  const data = buckets.map((b) => ({
    label: b.label,
    value: Number(b.value ?? 0),
  }));
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 8, right: 12, bottom: 24, left: 8 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 12 }}
          interval={0}
          angle={-20}
          textAnchor="end"
          height={48}
        />
        <YAxis tickFormatter={compactNumber} width={56} />
        <Tooltip
          formatter={(value: any) => compactNumber(value as number)}
          contentStyle={{ fontSize: 12 }}
        />
        <Bar dataKey="value" />
      </BarChart>
    </ResponsiveContainer>
  );
}
