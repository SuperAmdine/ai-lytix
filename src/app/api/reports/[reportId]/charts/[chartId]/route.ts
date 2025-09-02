import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { and, eq } from "drizzle-orm";
import { reportChart } from "@/db/report-schema";
import { ChartSpecSchema } from "@/types/chart-spec";

const PatchBody = z.object({
  title: z.string().min(1).optional(),
  viz_type: z.enum(["line", "bar", "table"]).optional(),
  spec: ChartSpecSchema.optional(),
  position: z.number().int().min(0).optional(),
  width: z.number().int().min(1).max(12).optional(),
  height: z.number().int().min(1).max(12).optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: { reportId: string; chartId: string } }
) {
  // TODO: auth check
  const updates = PatchBody.parse(await req.json());

  const {reportId,chartId} = await params
  const [row] = await db
    .update(reportChart)
    .set({ ...updates, updated_at: new Date() })
    .where(
      and(
        eq(reportChart.report_id,  reportId),
        eq(reportChart.id, chartId)
      )
    )
    .returning();

  return NextResponse.json(row ?? null);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { reportId: string; chartId: string } }
) {

   const {reportId,chartId} = await params
  // TODO: auth check
  await db
    .delete(reportChart)
    .where(
      and(
        eq(reportChart.report_id,  reportId),
        eq(reportChart.id,  chartId)
      )
    );

  return NextResponse.json({ ok: true });
}