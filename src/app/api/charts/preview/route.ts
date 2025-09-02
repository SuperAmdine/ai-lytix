import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { ChartSpecSchema } from "@/types/chart-spec";
import { buildPlan } from "@/lib/metrics/planner";
import { ClarifyError } from "@/lib/metrics/generate";

const Body = z.object({ spec: ChartSpecSchema });

export async function POST(req: NextRequest) {
  try {
    const { spec } = Body.parse(await req.json());
    const plan = buildPlan(spec);

    const [data, cov] = await Promise.all([plan.run(), plan.coverage()]);
    return NextResponse.json({
      data,
      coverage: { expected: cov.expected, present: cov.present },
      fresh_as_of: cov.freshness,
      notes: cov.present < cov.expected ? "Some values may still be syncing." : undefined,
    });
  } catch (e: any) {
    if (e?.code === "CLARIFY") {
      return NextResponse.json({
        type: "clarify",
        slot: e.slot,
        message: e.message,
        choices: e.choices,
      }, { status: 400 });
    }
    return NextResponse.json({ error: e?.message ?? "Preview failed" }, { status: 500 });
  }
}
