import React, { Suspense } from "react";
import {
  PageContainer,
  PageContainerContent,
  PageContainerHeader,
  PageContainerHeaderMoreActions,
  PageContainerHeaderTitle,
} from "@/components/page-container";
import { NavigationBar } from "@/components/navigation-bar";
import { getSession } from "@/lib/get-session";
import { db } from "@/db";
import { connections, report, workspaces } from "@/db/schema";
import { and, eq, inArray } from "drizzle-orm";

import { fetchFromFacebookHelper } from "@/lib/facebook";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { AvatarImage } from "@radix-ui/react-avatar";
import { facebookAdAccounts } from "@/db/facebook-schema";
import { redirect } from "next/navigation";
import { IconBrandMeta } from "@tabler/icons-react";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import ChatSidebar from "./chat-side-bar";
import { AddChartSheet } from "./side-sheet";
import ReportGrid from "@/components/report/report-grid";

export const revalidate = 0;

async function fetchReportCharts(reportId: string) {
  const res = await fetch(`http://localhost:3000/api/reports/${reportId}/charts`, {
    cache: "no-store",
  });
  if (!res.ok) return [];
  return res.json();
}

export default async function ReportHome({
  params,
  searchParams,
}: {
  params: { w_id: string; r_id: string };
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const session = await getSession();
  const { w_id, r_id } = await params;
  if (!session) redirect("/sign-in");

  const [my_report] = await db
    .select()
    .from(report)
    .where(and(eq(report.id, r_id), eq(report.user_id, session.user.id)));

  // const fb_connection_id = ws.facebook?.connection_id;
const charts = await fetchReportCharts(r_id);
  return (
    <>
      <NavigationBar workspace_id={w_id} />
      <PageContainer>
        <PageContainerHeader>
          <PageContainerHeaderTitle>{my_report.name}</PageContainerHeaderTitle>
          <PageContainerHeaderMoreActions>
            <Button variant="outline" size="sm" className="text-xs">
              Save
            </Button>
            <Button variant="outline" size="sm" className="text-xs">
              Export
            </Button>
            {/* <CreateWorkspaceDialog /> */}
          </PageContainerHeaderMoreActions>
        </PageContainerHeader>
        <PageContainerContent>
          <div className="grid gap-6 max-w-3xl mx-auto">
            {/* Rename */}
            <p className="text-center text-sm">
              You have no graph to display yet !
            </p>
            <div className="flex flex-row gap-3 justify-center">
              <Button>Add a new chart</Button>
              <Button variant="outline">Load From template</Button>
              <AddChartSheet reportId={r_id} />
            </div>
          </div>
          <div className="p-4">
             <ReportGrid
        items={charts.map((c: any) => ({
          id: c.id,
          title: c.title,
          viz_type: c.viz_type,
          width: c.width ?? 6,
          height: c.height ?? 3,
          spec: c.spec,
        }))}
      />
          </div>
        </PageContainerContent>
      </PageContainer>
    </>
  );
}
