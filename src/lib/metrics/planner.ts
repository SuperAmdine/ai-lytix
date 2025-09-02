import { and, between, countDistinct, eq, inArray, sql } from "drizzle-orm";
import { ChartSpec } from "@/types/chart-spec";
import { METRICS } from "./registry";
import { metricExprFor } from "./generate";
import { fbAdDaily, facebookCampaigns, facebookAdSets, facebookAds } from "@/db/schema"; // adjust
import { factAbsence } from "@/db/telemetry";
import { db } from "@/db";

const toYMD = (d: Date) => d.toISOString().slice(0,10);

export function dateRangeFromPreset(preset: ChartSpec["dateRange"]["preset"]) {
  const end = new Date(); const start = new Date();
  if (preset === "last_7_days") start.setDate(end.getDate() - 6);
  else if (preset === "last_14_days") start.setDate(end.getDate() - 13);
  else if (preset === "last_30_days") start.setDate(end.getDate() - 29);
  else if (preset === "this_month") { start.setDate(1); }
  else if (preset === "last_month") {
    start.setMonth(end.getMonth()-1, 1); end.setDate(0);
  }
  start.setHours(0,0,0,0); end.setHours(23,59,59,999);
  return { start: toYMD(start), end: toYMD(end) };
}

export type PlanResult = {
  sqlKind: "timeseries" | "categorical";
  // Drizzle can build queries directly; we return enough info to run them
  run: () => Promise<any>;
  coverage: () => Promise<{ expected: number; present: number; freshness: Date | null }>;
};

export function buildPlan(spec: ChartSpec): PlanResult {
  const { start, end } = dateRangeFromPreset(spec.dateRange.preset);
  const level = spec.entities.level;
  const idCol =
    level === "campaign" ? fbAdDaily.campaign_id :
    level === "adset"    ? fbAdDaily.adset_id    :
                           fbAdDaily.ad_id;

  const breakdownCol =
    spec.breakdown.by === "day"      ? fbAdDaily.date :
    spec.breakdown.by === "campaign" ? fbAdDaily.campaign_id :
    spec.breakdown.by === "adset"    ? fbAdDaily.adset_id :
                                       fbAdDaily.ad_id;

  const where = and(
    between(fbAdDaily.date, start, end),
    spec.entities.scope === "selected" && spec.entities.ids.length
      ? inArray(idCol, spec.entities.ids)
      : undefined,
  );

  // metric expression
  const mExpr = metricExprFor(
    spec.metric.key as any,
    fbAdDaily,
    { denominator: (spec.metric as any).denominator }
  ).as("value");

  // Timeseries
  if (spec.breakdown.by === "day") {
    return {
      sqlKind: "timeseries",
      run: async () => {
        const rows = await db
          .select({ bucket: fbAdDaily.date, value: mExpr })
          .from(fbAdDaily)
          .where(where)
          .groupBy(fbAdDaily.date)
          .orderBy(fbAdDaily.date);
        return { kind: "timeseries", points: rows.map(r => ({ x: r.bucket, y: Number(r.value ?? 0) })) };
      },
      coverage: async () => {
        // expected = #days in range
        const startD = new Date(start); const endD = new Date(end);
        const expected = Math.max(1, Math.round((+endD - +startD) / 86400000) + 1);

        // present days = days with either data rows OR absence entries (not expired)
        const [{ daysPresent }] = await db
          .select({
            daysPresent: countDistinct(fbAdDaily.date),
          })
          .from(fbAdDaily)
          .where(where);

        // add absences (treat as present)
        const nowIso = new Date().toISOString();
        const [{ daysAbsent }] = await db
          .select({ daysAbsent: countDistinct(factAbsence.date) })
          .from(factAbsence)
          .where(and(
            eq(factAbsence.provider, "facebook"),
            eq(factAbsence.level, level),
            between(factAbsence.date, start, end),
            // optional: scope to selected IDs
            spec.entities.scope === "selected" && spec.entities.ids.length
              ? inArray(factAbsence.levelId, spec.entities.ids)
              : undefined,
            sql`${factAbsence.absentExpiresAt} > ${nowIso}`,
          ));

        const [{ maxUpdated }] = await db
          .select({ maxUpdated: sql<Date>`MAX(${fbAdDaily.last_synced})` })
          .from(fbAdDaily)
          .where(where);

        return { expected, present: Number(daysPresent ?? 0) + Number(daysAbsent ?? 0), freshness: maxUpdated ?? null };
      }
    };
  }

  // Categorical by entity (with name lookup)
  return {
    sqlKind: "categorical",
    run: async () => {
      const rows = await db
        .select({ bucket: breakdownCol, value: mExpr })
        .from(fbAdDaily)
        .where(where)
        .groupBy(breakdownCol)
        .orderBy(breakdownCol);

      const ids = rows.map(r => String(r.bucket));
      let labels: string[] = ids;
      if (spec.breakdown.by === "campaign" && ids.length) {
        const names = await db.select({ id: facebookCampaigns.id, name: facebookCampaigns.name })
          .from(facebookCampaigns).where(inArray(facebookCampaigns.id, ids));
        const map = new Map(names.map(n => [n.id, n.name ?? n.id]));
        labels = ids.map(id => map.get(id) ?? id);
      } else if (spec.breakdown.by === "adset" && ids.length) {
        const names = await db.select({ id: facebookAdSets.id, name: facebookAdSets.name })
          .from(facebookAdSets).where(inArray(facebookAdSets.id, ids));
        const map = new Map(names.map(n => [n.id, n.name ?? n.id]));
        labels = ids.map(id => map.get(id) ?? id);
      } else if (spec.breakdown.by === "ad" && ids.length) {
        const names = await db.select({ id: facebookAds.id, name: facebookAds.name })
          .from(facebookAds).where(inArray(facebookAds.id, ids));
        const map = new Map(names.map(n => [n.id, n.name ?? n.id]));
        labels = ids.map(id => map.get(id) ?? id);
      }

      return {
        kind: "categorical",
        buckets: labels.map((label, i) => ({ label, value: Number(rows[i].value ?? 0) })),
      };
    },
    coverage: async () => {
      // expected = distinct entities in scope (if selected: count of ids; if all: distinct in range)
      let expected = spec.entities.scope === "selected" && spec.entities.ids.length
        ? spec.entities.ids.length
        : 0;

      if (expected === 0) {
        const [{ cnt }] = await db
          .select({ cnt: countDistinct(breakdownCol) })
          .from(fbAdDaily)
          .where(and(between(fbAdDaily.date, start, end)));
        expected = Number(cnt ?? 0);
      }

      const [{ present }] = await db
        .select({ present: countDistinct(breakdownCol) })
        .from(fbAdDaily)
        .where(where);

      const [{ maxUpdated }] = await db
        .select({ maxUpdated: sql<Date>`MAX(${fbAdDaily.last_synced})` })
        .from(fbAdDaily)
        .where(where);

      return { expected, present: Number(present ?? 0), freshness: maxUpdated ?? null };
    }
  };
}