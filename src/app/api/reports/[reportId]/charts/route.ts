import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { eq, asc } from "drizzle-orm";
import { reportChart } from "@/db/report-schema"; // path -> where your reportChart is exported
import { ChartSpecSchema } from "@/types/chart-spec";

// ----- validation -----
const CreateBody = z.object({
  title: z.string().min(1),
  viz_type: z.enum(["line", "bar", "table"]),
  spec: ChartSpecSchema,
  // optional layout; use your defaults if omitted
  position: z.number().int().min(0).optional(),
  width: z.number().int().min(1).max(12).optional(),
  height: z.number().int().min(1).max(12).optional(),
});

// GET /api/reports/:reportId/charts
export async function GET(
  _req: NextRequest,
  { params }: { params: { reportId: string } }
) {
  // TODO: authorize user for this reportId
   const {reportId } = await params
  const rows = await db
    .select()
    .from(reportChart)
    .where(eq(reportChart.report_id,  reportId))
    .orderBy(asc(reportChart.position), asc(reportChart.created_at));

  return NextResponse.json(rows);
}

// POST /api/reports/:reportId/charts
export async function POST(
  req: NextRequest,
  { params }: { params: { reportId: string } }
) {
  // TODO: authorize user for this reportId
  const body = CreateBody.parse(await req.json());
 const {reportId } = await params
  const [row] = await db
    .insert(reportChart)
    .values({
      report_id:  reportId,
      title: body.title,
      viz_type: body.viz_type,
      spec: body.spec,
      position: body.position ?? 0,
      width: body.width ?? 6,
      height: body.height ?? 3,
    })
    .returning();

  return NextResponse.json(row, { status: 201 });
}