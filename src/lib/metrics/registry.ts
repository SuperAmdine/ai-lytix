import { z } from "zod";

export const MetricKey = z.enum([
  /* raw (columns) */
  "impressions",
  "reach",
  "clicks",
  "link_clicks",
  "spend",

  /* raw (extras JSONB) */
  "unique_link_clicks",
  "landing_page_views",
  "purchases",
  "leads",
  "purchase_value",

  /* derived */
  "ctr",
  "unique_ctr",
  "cpc",
  "cost_per_unique_link_click",
  "cpm",
  "frequency",
  "cpl",
  "cppurchase",
  "cpr",
  "roas",
]);
export type MetricKey = z.infer<typeof MetricKey>;

export type MetricDef = {
  key: MetricKey;
  label: string;
  description?: string;
  category: "Delivery" | "Engagement" | "Spend" | "Efficiency" | "Conversions" | "ROI" ;
  type: "raw" | "derived";
  provider: "facebook";
  providerFields: string[];               // FB insight fields needed
  availableLevels: Array<"campaign"|"adset"|"ad">;
  defaultAgg: "sum" | "avg";
  unit: "count" | "currency" | "rate" | "cost_per";
  scaleHint?: "per_1" | "per_100" | "per_1000";
  // For derived:
  requiresDenominator?: boolean;          // e.g., CPR
  allowedDenominators?: string[];         // "results", "purchases" ...
};

 
export const METRICS: Record<MetricKey, MetricDef> = {
  /* =========================
   * RAW (physical columns)
   * ========================= */
  impressions: {
    key: "impressions",
    label: "Impressions",
    category: "Delivery",
    type: "raw",
    provider: "facebook",
    providerFields: ["impressions"],
    availableLevels: ["campaign", "adset", "ad"],
    defaultAgg: "sum",
    unit: "count",
  },
  reach: {
    key: "reach",
    label: "Reach",
    category: "Delivery",
    type: "raw",
    provider: "facebook",
    providerFields: ["reach"],
    availableLevels: ["campaign", "adset", "ad"],
    defaultAgg: "sum",
    unit: "count",
  },
  clicks: {
    key: "clicks",
    label: "Clicks (All)",
    category: "Engagement",
    type: "raw",
    provider: "facebook",
    providerFields: ["clicks"],
    availableLevels: ["campaign", "adset", "ad"],
    defaultAgg: "sum",
    unit: "count",
  },
  link_clicks: {
    key: "link_clicks",
    label: "Link Clicks",
    category: "Engagement",
    type: "raw",
    provider: "facebook",
    providerFields: ["link_clicks"],
    availableLevels: ["campaign", "adset", "ad"],
    defaultAgg: "sum",
    unit: "count",
  },
  spend: {
    key: "spend",
    label: "Spend",
    category: "Spend",
    type: "raw",
    provider: "facebook",
    providerFields: ["spend"],
    availableLevels: ["campaign", "adset", "ad"],
    defaultAgg: "sum",
    unit: "currency",
  },

  /* =========================
   * RAW (from extras JSONB)
   * =========================
   * These exist in fb_ad_daily.extras ->> '<key>'
   * and can be promoted to columns later.
   */
  unique_link_clicks: {
    key: "unique_link_clicks",
    label: "Unique Link Clicks",
    category: "Engagement",
    type: "raw",
    provider: "facebook",
    providerFields: ["unique_link_clicks"], // read from extras
    availableLevels: ["campaign", "adset", "ad"],
    defaultAgg: "sum",
    unit: "count",
  },
  landing_page_views: {
    key: "landing_page_views",
    label: "Landing Page Views",
    category: "Engagement",
    type: "raw",
    provider: "facebook",
    providerFields: ["landing_page_views"], // extras
    availableLevels: ["campaign", "adset", "ad"],
    defaultAgg: "sum",
    unit: "count",
  },
  purchases: {
    key: "purchases",
    label: "Purchases",
    category: "Conversions",
    type: "raw",
    provider: "facebook",
    providerFields: ["purchases"], // extras
    availableLevels: ["campaign", "adset", "ad"],
    defaultAgg: "sum",
    unit: "count",
  },
  leads: {
    key: "leads",
    label: "Leads",
    category: "Conversions",
    type: "raw",
    provider: "facebook",
    providerFields: ["leads"], // extras
    availableLevels: ["campaign", "adset", "ad"],
    defaultAgg: "sum",
    unit: "count",
  },
  purchase_value: {
    key: "purchase_value",
    label: "Purchase Value",
    category: "Conversions",
    type: "raw",
    provider: "facebook",
    providerFields: ["purchase_value"], // extras (aka action_values for purchase)
    availableLevels: ["campaign", "adset", "ad"],
    defaultAgg: "sum",
    unit: "currency",
  },

  /* =========================
   * DERIVED (aggregates)
   * ========================= */
  ctr: {
    key: "ctr",
    label: "CTR",
    category: "Efficiency",
    type: "derived",
    provider: "facebook",
    providerFields: ["clicks", "impressions"],
    availableLevels: ["campaign", "adset", "ad"],
    defaultAgg: "sum",
    unit: "rate",
    scaleHint: "per_1",
  },
  unique_ctr: {
    key: "unique_ctr",
    label: "Unique CTR",
    category: "Efficiency",
    type: "derived",
    provider: "facebook",
    providerFields: ["unique_link_clicks", "reach"], // unique_link_clicks from extras
    availableLevels: ["campaign", "adset", "ad"],
    defaultAgg: "sum",
    unit: "rate",
    scaleHint: "per_1",
  },
  cpc: {
    key: "cpc",
    label: "CPC",
    category: "Efficiency",
    type: "derived",
    provider: "facebook",
    providerFields: ["spend", "clicks"],
    availableLevels: ["campaign", "adset", "ad"],
    defaultAgg: "sum",
    unit: "cost_per",
    scaleHint: "per_1",
  },
  cost_per_unique_link_click: {
    key: "cost_per_unique_link_click",
    label: "Cost per Unique Link Click",
    category: "Efficiency",
    type: "derived",
    provider: "facebook",
    providerFields: ["spend", "unique_link_clicks"], // extras
    availableLevels: ["campaign", "adset", "ad"],
    defaultAgg: "sum",
    unit: "cost_per",
    scaleHint: "per_1",
  },
  cpm: {
    key: "cpm",
    label: "CPM",
    category: "Efficiency",
    type: "derived",
    provider: "facebook",
    providerFields: ["spend", "impressions"],
    availableLevels: ["campaign", "adset", "ad"],
    defaultAgg: "sum",
    unit: "cost_per",
    scaleHint: "per_1000",
  },
  frequency: {
    key: "frequency",
    label: "Frequency",
    category: "Delivery",
    type: "derived",
    provider: "facebook",
    providerFields: ["impressions", "reach"],
    availableLevels: ["campaign", "adset", "ad"],
    defaultAgg: "sum",
    unit: "rate",
    scaleHint: "per_1",
  },
  cpl: {
    key: "cpl",
    label: "CPL (Cost per Lead)",
    category: "Efficiency",
    type: "derived",
    provider: "facebook",
    providerFields: ["spend", "leads"], // extras
    availableLevels: ["campaign", "adset", "ad"],
    defaultAgg: "sum",
    unit: "cost_per",
    scaleHint: "per_1",
  },
  cppurchase: {
    key: "cppurchase",
    label: "CPP (Cost per Purchase)",
    category: "Efficiency",
    type: "derived",
    provider: "facebook",
    providerFields: ["spend", "purchases"], // extras
    availableLevels: ["campaign", "adset", "ad"],
    defaultAgg: "sum",
    unit: "cost_per",
    scaleHint: "per_1",
  },
  cpr: {
    key: "cpr",
    label: "CPR (Cost per Result)",
    category: "Efficiency",
    type: "derived",
    provider: "facebook",
    providerFields: ["spend", "{denominator}"], // runtime-chosen
    availableLevels: ["campaign", "adset", "ad"],
    defaultAgg: "sum",
    unit: "cost_per",
    scaleHint: "per_1",
    requiresDenominator: true,
    allowedDenominators: ["leads", "purchases", "landing_page_views", "link_clicks"],
  },
  roas: {
    key: "roas",
    label: "ROAS (Purchase)",
    category: "ROI",
    type: "derived",
    provider: "facebook",
    providerFields: ["purchase_value", "spend"], // purchase_value from extras
    availableLevels: ["campaign", "adset", "ad"],
    defaultAgg: "sum",
    unit: "rate",
    scaleHint: "per_1",
  },
};

export function listCatalog() {
  // Shape for combobox: grouped by category
  const groups = Array.from(new Set(Object.values(METRICS).map(m => m.category)));
  return groups.map(cat => ({
    category: cat,
    items: Object.values(METRICS).filter(m => m.category === cat).map(m => ({
      key: m.key, label: m.label, unit: m.unit, type: m.type,
    })),
  }));
}