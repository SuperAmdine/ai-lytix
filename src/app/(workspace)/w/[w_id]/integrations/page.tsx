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
import { connections, workspaces } from "@/db/schema";
import { and, eq, inArray } from "drizzle-orm";

import { fetchFromFacebookHelper } from "@/lib/facebook";
import { SaveFacebookSelectionForm } from "./facebook-adaccount-selection";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { AvatarImage } from "@radix-ui/react-avatar";
import { facebookAdAccounts } from "@/db/facebook-schema";
import { redirect } from "next/navigation";
import { IconBrandMeta } from "@tabler/icons-react";
import { Separator } from "@/components/ui/separator";
import { RenameWorkspace, ConnectFacebookButton } from "./integrations.forms";

export const revalidate = 0;

export default async function WorkspaceIntegrations({
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

  const fb_connection_id = ws.facebook?.connection_id;
  return (
    <>
      <NavigationBar />
      <PageContainer>
        <PageContainerHeader>
          <PageContainerHeaderTitle>
            Workspace Integrations
          </PageContainerHeaderTitle>
          <PageContainerHeaderMoreActions>
            {/* <CreateWorkspaceDialog /> */}
          </PageContainerHeaderMoreActions>
        </PageContainerHeader>
        <PageContainerContent>
          <div className="grid gap-6 max-w-3xl mx-auto">
            {/* Rename */}
            <section className="rounded-xl border p-4">
              <Suspense>
                <h2 className="text-sm font-medium">Workspace Name</h2>
                <div className="mt-3">
                  <RenameWorkspace wId={ws.id} initialName={ws.name} />
                </div>
              </Suspense>
              <Suspense fallback={<div>loading..</div>}>
                {/* <pre>{JSON.stringify(ws, null, 4)}</pre> */}
                <div className="mt-4">
                  <ConnectFacebookButton wId={ws.id} />

                  {!!ws.facebook?.connection_id && (
                    <div>
                      <FacebookSelection
                        wId={w_id}
                        selectedAdAccountId={ws.facebook?.ad_account_id}
                        connectionId={fb_connection_id}
                      />
                    </div>
                  )}
                </div>
              </Suspense>
            </section>
          </div>
        </PageContainerContent>
      </PageContainer>
    </>
  );
}

export async function FacebookSelection({
  wId,
  selectedAdAccountId,
  connectionId,
}: {
  wId: string;
  selectedAdAccountId?: string | null;
  connectionId?: string | null;
}) {
  const session = await getSession();
  if (!session) return null;

  if (!connectionId) {
    return (
      <div className="text-sm text-muted-foreground">
        Facebook not connected yet.
      </div>
    );
  }

  const [fb] = await db
    .select()
    .from(connections)
    .where(
      and(
        eq(connections.id, connectionId),
        eq(connections.user_id, session.user.id)
      )
    );

  if (!fb) {
    return (
      <div className="text-sm text-red-600">
        Facebook connection not found for this user.
      </div>
    );
  }

  const adAccounts = await getFacebookAdAccountsCached({
    accessToken: fb.access_token,
    providerId: fb.provider_id,
  });

  return (
    <div className="gap-4 flex flex-col  p-4">
      <Suspense>
        <div className="flex flex-row  items-center p-1 bg-secondary px-5">
          <IconBrandMeta /> <span className="ml-3">Facebook / Meta</span>
          <div className="flex gap-2 items-center h-10 ml-auto">
            <Separator orientation="vertical" className="" />
            <Avatar>
              <AvatarImage src={fb.meta?.picture_url} />
              <AvatarFallback></AvatarFallback>
            </Avatar>
            <div className="text-sm">
              <span className="block font-medium">{fb.meta?.display_name}</span>
              <span className="text-gray-600 antialiased">
                {fb.meta?.email}
              </span>
            </div>
          </div>
        </div>

        <SaveFacebookSelectionForm
          wId={wId}
          connectionId={connectionId}
          adAccounts={adAccounts}
          selectedAdAccountId={selectedAdAccountId ?? undefined}
        />
      </Suspense>
    </div>
  );
}

export async function fetchAdAccounts({
  accessToken,
}: {
  accessToken: string;
}) {
  const limit = 1000;
  let fbAdAccountsRequest = await fetchFromFacebookHelper(
    "/me/adaccounts",
    accessToken,
    {
      fields: ["id", "name", "currency", "timezone_name"],
      limit,
    }
  );

  return fbAdAccountsRequest.data as Array<{
    id: string;
    account_id: string;
    name: string;
    currency?: string;
    timezone_name?: string;
  }>;
}

type GetOpts = {
  providerId: string;
  accessToken: string;
  forceRefresh?: boolean;
  maxAgeMs?: number; // e.g., 24 * 60 * 60 * 1000
};

export async function getFacebookAdAccountsCached(opts: GetOpts) {
  const {
    providerId,
    accessToken,
    forceRefresh = false,
    maxAgeMs = 24 * 60 * 60 * 1000, // 24h default
  } = opts;

  const now = new Date();

  const cached = await db
    .select()
    .from(facebookAdAccounts)
    .where(eq(facebookAdAccounts.provider_id, providerId));

  const fresh =
    cached.length > 0 &&
    cached.every(
      (r) => now.getTime() - new Date(r.last_synced_at).getTime() < maxAgeMs
    );

  if (fresh && !forceRefresh) {
    return cached.sort((a, b) => a.name?.localeCompare(b.name ?? "") ?? 0);
  }

  const remote = await fetchAdAccounts({ accessToken: accessToken });

  if (remote.length > 0) {
    const rows = remote.map((a) => ({
      ad_account_id: a.id,
      provider_id: providerId,
      name: a.name ?? null,
      currency: a.currency ?? null,
      timezone_name: a.timezone_name ?? null,
      last_synced_at: now,
      updated_at: now,
    }));

    await db
      .insert(facebookAdAccounts)
      .values(rows)
      .onConflictDoUpdate({
        target: [facebookAdAccounts.ad_account_id],
        set: {
          ad_account_id: facebookAdAccounts.ad_account_id as any,
          name: facebookAdAccounts.name as any,
          currency: facebookAdAccounts.currency as any,
          timezone_name: facebookAdAccounts.timezone_name as any,
          provider_id: facebookAdAccounts.provider_id as any,
          last_synced_at: now,
          updated_at: now,
        },
      });
    console.log("from facebook");
  }

  return db
    .select()
    .from(facebookAdAccounts)
    .where(eq(facebookAdAccounts.provider_id, providerId));
}
