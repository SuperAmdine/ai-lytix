import React from "react";
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
import { and, eq } from "drizzle-orm";
import { RenameWorkspace } from "./workspace.rename";
import { ConnectFacebookButton } from "./connect-facebook";
import { fetchFromFacebookHelper } from "@/lib/facebook";
import { SaveFacebookSelectionForm } from "./facebook-adaccount-selection";
export const revalidate = 0;

async function WorkspaceIntegrations({
  params,
  searchParams,
}: {
  params: { w_id: string };
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const session = await getSession();
  const { w_id } = await params;
  if (!session) return null;

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
          <div className="grid gap-6 max-w-3xl">
            {/* Rename */}
            <section className="rounded-xl border p-4">
              <h2 className="text-sm font-medium">Workspace Name</h2>
              <div className="mt-3">
                <RenameWorkspace wId={ws.id} initialName={ws.name} />
              </div>

              <pre>{JSON.stringify(ws, null, 4)}</pre>
              <div className="mt-4">
                {/* {!connected ? ( */}
                <ConnectFacebookButton wId={ws.id} />
                {/* ) : (
                  <FacebookSelection
                    wId={ws.id}
                    linkedFbUserId={ws.facebook_user_id}
                    selectedAdAccountId={ws.facebook_ad_account_id}
                  />
                )} */}

                {!!ws.facebook?.connection_id && (
                  <div>
                    linked
                    <FacebookSelection
                      wId={w_id}
                      selectedAdAccountId={ws.facebook?.ad_account_id}
                      connectionId={fb_connection_id}
                    />
                  </div>
                )}
              </div>
            </section>
          </div>
        </PageContainerContent>
      </PageContainer>
    </>
  );
}

// src/app/(workspace)/w/[w_id]/integrations/_components/facebook-selection.server.tsx

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

  const adAccounts = await fetchAdAccounts({ accessToken: fb.access_token });

  return (
    <div>
      Save
      <pre>{JSON.stringify(fb, null, 4)}</pre>
      <SaveFacebookSelectionForm
        wId={wId}
        connectionId={connectionId}
        adAccounts={adAccounts}
        selectedAdAccountId={selectedAdAccountId ?? undefined}
      />
    </div>
  );
  // return (
  //   <SaveFacebookSelectionForm
  //     wId={wId}
  //     fbUserId={linkedFbUserId}
  //     adAccounts={adAccounts}
  //     selectedAdAccountId={selectedAdAccountId ?? undefined}
  //   />
  // );
}
export default WorkspaceIntegrations;

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
  // fields: account id + name
  // v;

  // const resp = await fetch(u, { cache: "no-store" });
  // const json = await resp.json();
  // if (!resp.ok)
  // throw new Error(json.error?.message || "Failed to list ad accounts");
  return fbAdAccountsRequest.data as Array<{
    id: string;
    account_id: string;
    name: string;
    currency?: string;
    timezone_name?: string;
  }>;
}
