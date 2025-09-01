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

export const revalidate = 0;

export default async function WorkspaceHome({
  params,
  searchParams,
}: {
  params: { w_id: string };
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const session = await getSession();
  const { w_id } = await params;
  if (!session) redirect("/sign-in");

  const [ws] = await db
    .select()
    .from(workspaces)
    .where(
      and(eq(workspaces.id, w_id), eq(workspaces.user_id, session.user.id))
    );

  if (!ws) {
    // you can throw not-found() and render a 404
    return <div className="p-6">Workspace not found.</div>;
  }

  const my_reports = await db
    .select()
    .from(report)
    .where(
      and(eq(report.workspace_id, w_id), eq(report.user_id, session.user.id))
    );

  const fb_connection_id = ws.facebook?.connection_id;

  return (
    <>
      <NavigationBar workspace_id={w_id} />
      <PageContainer>
        <PageContainerHeader>
          <PageContainerHeaderTitle>{ws.name}</PageContainerHeaderTitle>
          <PageContainerHeaderMoreActions>
            {/* <Button>Save</Button> */}
            <Button variant="outline" size="sm" className="text-xs">
              Create a Report
            </Button>
            {/* <CreateWorkspaceDialog /> */}
          </PageContainerHeaderMoreActions>
        </PageContainerHeader>
        <PageContainerContent>
          <div className="grid gap-6 max-w-3xl mx-auto">
            {/* Rename */}
            {!my_reports && (
              <section className="rounded-xl border p-4">No report yet</section>
            )}
            {my_reports && (
              <section className="rounded-xl border p-4">
                <span className="text-lg font-medium">My reports</span>
                {my_reports.map((r) => (
                  <div key={r.id}>
                    <Link
                      href={`/w/${r.workspace_id}/r/${r.id}`}
                      scroll={false}
                    >
                      {r.name}
                    </Link>
                  </div>
                ))}
              </section>
            )}
          </div>
        </PageContainerContent>
      </PageContainer>
    </>
  );
}
