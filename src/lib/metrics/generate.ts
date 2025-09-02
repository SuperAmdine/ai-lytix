import { sql, type SQL } from "drizzle-orm";
import { METRICS, type MetricKey } from "./registry";

/**
 * Helper: SUM(COALESCE(expr,0))
 * Ensures missing extras/nulls don't break aggregates.
 */
const S = (expr: SQL) => sql<number>`SUM(COALESCE(${expr}, 0))`;

/**
 * Map registry keys to fb_ad_daily columns or extras.
 * For extras we cast to numeric.
 *
 * NOTE: keep these static (no dynamic key building) so Drizzle can prepare SQL safely.
 */
export const RAW_COL: Record<
  string,
  (t: any) => SQL<number> // always numeric for aggregation
> = {
  // physical columns
  impressions: (t) => t.impressions,
  clicks:      (t) => t.clicks,
  link_clicks: (t) => t.link_clicks,
  spend:       (t) => t.spend,

  // you don't have a physical 'reach' column in fb_ad_daily, so pull from extras:
  reach:                (t) => sql<number>`((${t.extras} ->> 'reach')::numeric)`,

  // extras-based raw metrics
  unique_link_clicks:   (t) => sql<number>`((${t.extras} ->> 'unique_link_clicks')::numeric)`,
  landing_page_views:   (t) => sql<number>`((${t.extras} ->> 'landing_page_views')::numeric)`,
  purchases:            (t) => sql<number>`((${t.extras} ->> 'purchases')::numeric)`,
  leads:                (t) => sql<number>`((${t.extras} ->> 'leads')::numeric)`,
  purchase_value:       (t) => sql<number>`((${t.extras} ->> 'purchase_value')::numeric)`,
};

export class ClarifyError extends Error {
  code = "CLARIFY";
  slot: string;
  choices?: Array<{ id: string; label: string }>;
  constructor(msg: string, slot: string, choices?: Array<{ id: string; label: string }>) {
    super(msg);
    this.slot = slot;
    this.choices = choices;
  }
}

export function metricExprFor(
  key: MetricKey,
  t: any,                             // fb_ad_daily table reference
  opts?: { denominator?: string }
): SQL {
  const def = METRICS[key];
  if (!def) throw new Error(`Unknown metric: ${key}`);

  // RAW → SUM(COALESCE(col,0))
  if (def.type === "raw") {
    const colGetter = RAW_COL[key];
    if (!colGetter) throw new Error(`No column mapping for ${key}`);
    return S(colGetter(t));
  }

  // DERIVED (aggregate-first math using S())
  if (key === "ctr") {
    return sql`
      CASE
        WHEN ${S(RAW_COL.impressions(t))} = 0 THEN 0
        ELSE ${S(RAW_COL.clicks(t))}::float / NULLIF(${S(RAW_COL.impressions(t))}, 0)
      END
    `;
  }

  if (key === "cpm") {
    return sql`
      CASE
        WHEN ${S(RAW_COL.impressions(t))} = 0 THEN 0
        ELSE (${S(RAW_COL.spend(t))}::float * 1000.0) / NULLIF(${S(RAW_COL.impressions(t))}, 0)
      END
    `;
  }

  if (key === "cpc") {
    return sql`
      CASE
        WHEN ${S(RAW_COL.link_clicks(t))} = 0 THEN 0
        ELSE ${S(RAW_COL.spend(t))}::float / NULLIF(${S(RAW_COL.link_clicks(t))}, 0)
      END
    `;
  }

  if (key === "cpr") {
    const denomKey = opts?.denominator ?? "results";
    const denomGetter = RAW_COL[denomKey];
    if (!denomGetter) {
      // ask UI to choose a denominator
      throw new ClarifyError(
        "CPR needs a result type",
        "metric.denominator",
        (METRICS.cpr.allowedDenominators ?? []).map((k) => ({
          id: k,
          label: k.replaceAll("_", " "),
        }))
      );
    }
    return sql`
      CASE
        WHEN ${S(denomGetter(t))} = 0 THEN 0
        ELSE ${S(RAW_COL.spend(t))}::float / NULLIF(${S(denomGetter(t))}, 0)
      END
    `;
  }

  if (key === "unique_ctr") {
    return sql`
      CASE
        WHEN ${S(RAW_COL.reach(t))} = 0 THEN 0
        ELSE ${S(RAW_COL.unique_link_clicks(t))}::float / NULLIF(${S(RAW_COL.reach(t))}, 0)
      END
    `;
  }

  if (key === "cost_per_unique_link_click") {
    return sql`
      CASE
        WHEN ${S(RAW_COL.unique_link_clicks(t))} = 0 THEN 0
        ELSE ${S(RAW_COL.spend(t))}::float / NULLIF(${S(RAW_COL.unique_link_clicks(t))}, 0)
      END
    `;
  }

  if (key === "frequency") {
    return sql`
      CASE
        WHEN ${S(RAW_COL.reach(t))} = 0 THEN 0
        ELSE ${S(RAW_COL.impressions(t))}::float / NULLIF(${S(RAW_COL.reach(t))}, 0)
      END
    `;
  }

  if (key === "cpl") {
    return sql`
      CASE
        WHEN ${S(RAW_COL.leads(t))} = 0 THEN 0
        ELSE ${S(RAW_COL.spend(t))}::float / NULLIF(${S(RAW_COL.leads(t))}, 0)
      END
    `;
  }

  if (key === "cppurchase") {
    return sql`
      CASE
        WHEN ${S(RAW_COL.purchases(t))} = 0 THEN 0
        ELSE ${S(RAW_COL.spend(t))}::float / NULLIF(${S(RAW_COL.purchases(t))}, 0)
      END
    `;
  }

  if (key === "roas") {
    return sql`
      CASE
        WHEN ${S(RAW_COL.spend(t))} = 0 THEN 0
        ELSE ${S(RAW_COL.purchase_value(t))}::float / NULLIF(${S(RAW_COL.spend(t))}, 0)
      END
    `;
  }

  throw new Error(`No generator for derived metric: ${key}`);
}