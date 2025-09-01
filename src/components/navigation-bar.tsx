import { getSession } from "@/lib/get-session";

import { redirect } from "next/navigation";
import { UserProfile } from "./auth/profile.components";
import { Button } from "./ui/button";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { TeamSwitcher } from "./team-switcher";
import { Separator } from "./ui/separator";
import { PlusCircleIcon } from "lucide-react";
import { workspaces } from "@/db/workspace-schema";
import { db } from "@/db";
import { CreateReportDialog } from "@/app/(workspace)/w/[w_id]/r/report.forms";

export const NavigationBar = async ({
  workspace_id,
  report_id,
}: {
  workspace_id?: string;
  report_id?: string;
}) => {
  const session = await getSession();
  if (!session) redirect("/sign-in");
  const workspaces_data = await db.select().from(workspaces);
  return (
    <header className="fixed top h-13 items-center flex  w-full px-3 justify-between">
      <div className="flex gap-3 items-center flex-row w-fit">
        {/*  */}
        <div className="flex gap-1 items-center">
          <Image
            src={"/logo-296.svg"}
            alt="logo"
            width={30}
            height={30}
            className="size-7"
          />
          <div>
            <span className="font-bold">ai</span>
            <span className="font-bols">nalytic</span>
          </div>
        </div>

        <TeamSwitcher workspaces={workspaces_data} />
        <Button variant="outline" className="" size="sm">
          My Reports
        </Button>
        <Separator orientation="vertical" />
        <CreateReportDialog workspace_id={workspace_id} />
      </div>

      <div className="flex items-center">
        {/* <DropdownProfile data={me} /> */}

        <Button className="" variant="link" size="sm" asChild>
          <Link href="/">Workspaces</Link>
        </Button>

        <UserProfile
          name={session.user.name}
          email={session.user.email}
          image={session.user.image || undefined}
        />
      </div>
    </header>
  );
};
