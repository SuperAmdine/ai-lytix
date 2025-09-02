// src/app/(workspace)/w/[w_id]/r/[r_id]/side-sheet.tsx
"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EntityPicker, type Level } from "@/components/report/entity-picker";
import { ChartSpecSchema } from "@/types/chart-spec";
import ChartPreview from "@/components/chart/chart-preview";
import { Skeleton } from "@/components/ui/skeleton";
import { addChartToReport } from "@/lib/client/report-charts";

// ⬇️ use the MetricCombobox that returns { key, denominator? }
import { MetricCombobox, type MetricValue } from "@/components/chart/metric-combobox";

export function AddChartSheet({ reportId }: { reportId: string }) {
  const [open, setOpen] = useState(false);

  // source
  const [provider] = useState<"facebook">("facebook");
  const [level, setLevel] = useState<Level>("campaign");
  const [entities, setEntities] = useState<{ scope: "all" | "selected"; ids: string[] }>({
    scope: "all",
    ids: [],
  });

  // metric / range / vis
  const [metricSel, setMetricSel] = useState<MetricValue>({ key: "impressions" }); // default
  const [breakdown, setBreakdown] = useState<"day" | "campaign" | "adset" | "ad">("day");
  const [preset, setPreset] = useState("last_7_days");
  const [title, setTitle] = useState("New chart");

  const [preview, setPreview] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [isAddingToReport, setIsAddingToReport] = useState(false);

  async function doPreview() {
    if (!metricSel?.key) return;
    setLoading(true);
    const spec = ChartSpecSchema.parse({
      source: provider,
      entities: { level, scope: entities.scope, ids: entities.ids },
      metric: {
        key: metricSel.key,
        agg: "sum",
        ...(metricSel.denominator ? { denominator: metricSel.denominator } : {}),
      },
      breakdown: { by: breakdown },
      dateRange: { preset },
      filters: [],
      options: { yFormat: "compact" },
    });
    const res = await fetch("/api/charts/preview", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ spec }),
    }).then((r) => r.json());
    setPreview(res.data);
    setLoading(false);
  }

  async function addToReport() {
    if (!metricSel?.key) return;
    try {
      const spec = ChartSpecSchema.parse({
        source: provider,
        entities: { level, scope: entities.scope, ids: entities.ids },
        metric: {
          key: metricSel.key,
          agg: "sum",
          ...(metricSel.denominator ? { denominator: metricSel.denominator } : {}),
        },
        breakdown: { by: breakdown },
        dateRange: { preset },
        filters: [],
        options: { yFormat: "compact" },
      });
      setIsAddingToReport(true);
      await addChartToReport({
        reportId,
        title: title || "Untitled chart",
        viz_type: spec.breakdown.by === "day" ? "line" : "bar",
        spec,
      });
    } finally {
      setIsAddingToReport(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          onClick={() => {
            setOpen(true);
            doPreview();
          }}
        >
          Add a new chart
        </Button>
      </SheetTrigger>

      <SheetContent className="sm:max-w-4xl overflow-y-auto px-4">
        <SheetHeader>
          <SheetTitle>Add Chart</SheetTitle>
        </SheetHeader>

        <div className="my-4 border rounded-xl p-4">
          <div className="text-sm mb-2 font-medium">Graph Preview</div>
          <div className="h-[300px]">
            {loading ? <Skeleton className="w-full h-full" /> : <ChartPreview data={preview} />}
          </div>
        </div>

        <Tabs defaultValue="source" className="w-full">
          <TabsList>
            <TabsTrigger value="source">Source</TabsTrigger>
            <TabsTrigger value="metrics">Metrics</TabsTrigger>
            <TabsTrigger value="custom">Customisation</TabsTrigger>
            <TabsTrigger value="labels">Titles & Labels</TabsTrigger>
          </TabsList>

          {/* SOURCE */}
          <TabsContent value="source" className="pt-4 space-y-3">
            <div>
              <Label>Provider</Label>
              <div className="text-sm">Facebook</div>
            </div>

            <div className="grid md:grid-cols-2 gap-3">
              <div>
                <Label>Level</Label>
                <select
                  className="w-full border rounded-md h-9 px-2 text-sm"
                  value={level}
                  onChange={(e) => setLevel(e.target.value as Level)}
                >
                  <option value="campaign">Campaign</option>
                  <option value="adset">Ad set</option>
                  <option value="ad">Ad</option>
                </select>
              </div>
              <div>
                <Label>Targets</Label>
                <EntityPicker level={level} value={entities} onChange={setEntities} />
              </div>
            </div>
          </TabsContent>

          {/* METRICS */}
          <TabsContent value="metrics" className="pt-4 space-y-3">
            <div className="grid md:grid-cols-2 gap-3">
              <div>
                <Label>Metric</Label>
                {/* ⬇️ New combobox; controls both metric key and (when needed) denominator */}
                <MetricCombobox value={metricSel} onChange={setMetricSel} />
              </div>

              <div>
                <Label>Breakdown</Label>
                <select
                  className="w-full border rounded-md h-9 px-2 text-sm"
                  value={breakdown}
                  onChange={(e) => setBreakdown(e.target.value as any)}
                >
                  <option value="day">By day</option>
                  <option value="campaign">By campaign</option>
                  <option value="adset">By ad set</option>
                  <option value="ad">By ad</option>
                </select>
              </div>

              <div>
                <Label>Date Range</Label>
                <select
                  className="w-full border rounded-md h-9 px-2 text-sm"
                  value={preset}
                  onChange={(e) => setPreset(e.target.value)}
                >
                  <option value="last_7_days">Last 7 days</option>
                  <option value="last_14_days">Last 14 days</option>
                  <option value="last_30_days">Last 30 days</option>
                  <option value="this_month">This month</option>
                  <option value="last_month">Last month</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={doPreview}>
                Preview
              </Button>
              <Button onClick={addToReport} disabled={isAddingToReport}>
                {isAddingToReport ? "Adding…" : "Add to report"}
              </Button>
            </div>
          </TabsContent>

          {/* CUSTOMISATION */}
          <TabsContent value="custom" className="pt-4 text-sm text-muted-foreground">
            (coming soon)
          </TabsContent>

          {/* LABELS */}
          <TabsContent value="labels" className="pt-4 space-y-2">
            <Label>Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </TabsContent>
        </Tabs>

        <SheetFooter className="mt-6" />
      </SheetContent>
    </Sheet>
  );
}