import { NextResponse } from "next/server";
import { listCatalog, METRICS } from "@/lib/metrics/registry";

export async function GET() {
  return NextResponse.json({
    provider: "facebook",
    categories: listCatalog(),
    meta: Object.fromEntries(Object.values(METRICS).map(m => [
      m.key, {
        unit: m.unit, type: m.type, requiresDenominator: m.requiresDenominator ?? false,
        allowedDenominators: m.allowedDenominators ?? [],
      }
    ])),
  });
}