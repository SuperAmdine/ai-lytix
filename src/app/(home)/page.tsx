import { Button } from "@/components/ui/button";
import {
  PageContainer,
  PageContainerContent,
  PageContainerHeader,
  PageContainerHeaderMoreActions,
  PageContainerHeaderTitle,
} from "@/components/page-container";
import { NavigationBar } from "@/components/navigation-bar";
import { db } from "@/db";
import { workspaces } from "@/db/workspace-schema";
import { IconPlus } from "@tabler/icons-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  CreateWorkspaceDialog,
  DeleteWorkspaceConfirm,
} from "./workspace.forms";
import { Card } from "@/components/ui/card";

import Link from "next/link";
import { Suspense } from "react";
export default async function Home() {
  const workspaces_data = await db.select().from(workspaces);

  return (
    <>
      <NavigationBar />
      <PageContainer>
        <PageContainerHeader>
          <PageContainerHeaderTitle>Workspaces</PageContainerHeaderTitle>
          <PageContainerHeaderMoreActions>
            <CreateWorkspaceDialog />
          </PageContainerHeaderMoreActions>
        </PageContainerHeader>
        <PageContainerContent>
          <div className="max-w-3xl mx-auto">
            <Suspense fallback={<div>loading..</div>}>
              {
                workspaces_data.length > 0 &&
                  workspaces_data.map((workspace_item) => (
                    <div
                      key={workspace_item.id}
                      className="p-3 flex items-center gap-3 flex-row border-b"
                    >
                      <div className="min-w-0 flex-1 text-sm">
                        {/* <InlineRename
                      id={workspace_item.id}
                      initialName={ws.name}
                    /> */}
                        <Button
                          variant="link"
                          size="sm"
                          className="text-left px-0"
                          asChild
                        >
                          <Link href={`/w/${workspace_item.id}`}>
                            {workspace_item.name}
                          </Link>
                        </Button>

                        <div className="mt-1 text-xs text-muted-foreground">
                          Created{" "}
                          {new Date(
                            workspace_item.created_at!
                          ).toLocaleString()}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/w/${workspace_item.id}/integrations`}>
                            edit
                          </Link>
                        </Button>

                        <DeleteWorkspaceConfirm
                          id={workspace_item.id}
                          name={workspace_item.name}
                        />
                        {/* <DeleteWorkspaceButton id={workspace_item.id} /> */}
                      </div>
                    </div>
                  ))
                // <pre>{JSON.stringify(workspaces_data, null, 4)}</pre>
              }
            </Suspense>
            {workspaces_data.length === 0 && (
              <Alert variant="destructive">
                <AlertDescription>
                  No workspace found you need to create one
                </AlertDescription>
              </Alert>
            )}
          </div>
        </PageContainerContent>
      </PageContainer>
    </>
  );
}

/*
<div className="w-full p-2 border-b  flex items-center gap-3 border-b-gray-50">
            <div className="ml-3 font-sm font-normal">
              My New Report
              <span className="text-muted-foreground text-xs ml-4">
                #0193-849174-3918
              </span>
            </div>
              <DropdownMenuDemo /> 
            <div className="ml-auto flex gap-2">
              <Button className="text-sm" size="sm" variant="outline">
                <SaveIcon />
                Save
              </Button>

              <Button className="text-sm" size="sm" variant="outline">
                <SaveIcon />
                Export
              </Button>
            </div>
          </div>
          <div className="flex-1 overflow-scroll">{children}</div>
          */
