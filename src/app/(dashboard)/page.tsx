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
import { CreateWorkspaceDialog } from "./workspace.create";
import { Card } from "@/components/ui/card";

import { DeleteWorkspaceConfirm } from "./workspace.delete";
import Link from "next/link";
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
                      {workspace_item.name}
                      <div className="mt-1 text-xs text-muted-foreground">
                        Created{" "}
                        {new Date(workspace_item.created_at!).toLocaleString()}
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
