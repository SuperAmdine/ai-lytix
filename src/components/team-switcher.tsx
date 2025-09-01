"use client";

import * as React from "react";
import { ChevronsUpDown, Plus } from "lucide-react";
import { useParams } from "next/navigation";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

import {
  AudioWaveform,
  BookOpen,
  Bot,
  Command,
  Frame,
  GalleryVerticalEnd,
  Map,
  PieChart,
  Settings2,
  SquareTerminal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { IconCheck, IconCheckbox } from "@tabler/icons-react";
import { CreateWorkspaceDialog } from "@/app/(home)/workspace.forms";

const teams = [
  {
    name: "Acme Inc",
    logo: GalleryVerticalEnd,
    plan: "Enterprise",
  },
  {
    name: "Acme Corp.",
    logo: AudioWaveform,
    plan: "Startup",
  },
  {
    name: "Evil Corp.",
    logo: Command,
    plan: "Free",
  },
];

export function TeamSwitcher({ workspaces }: { workspaces: any[] }) {
  const isMobile = false;
  const [activeTeam, setActiveTeam] = React.useState(teams[0]);

  if (!activeTeam) {
    return null;
  }
  const params = useParams<{ w_id?: string }>();
  // console.log(params);
  const active_workspace =
    workspaces.find((e) => e.id === params.w_id) || undefined;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild disabled={params.w_id === undefined}>
        <Button
          variant="outline"
          size="sm"
          className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground w-48"
        >
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-medium">
              {active_workspace?.name}
            </span>
          </div>
          <ChevronsUpDown className="ml-auto" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
        align="start"
        // side={isMobile ? "bottom" : "right"}
        sideOffset={4}
      >
        <DropdownMenuLabel className="text-muted-foreground text-xs">
          Workspaces
        </DropdownMenuLabel>
        {workspaces &&
          workspaces.map((workspace_item, index) => (
            <DropdownMenuItem
              key={workspace_item.id}
              // onClick={() => setActiveTeam(team)}
              className="gap-2 p-2"
              asChild
            >
              <Link href={`/w/${workspace_item.id}`}>
                <div className="flex size-6 items-center justify-center rounded-md border">
                  {/* <team.logo className="size-3.5 shrink-0" /> */}
                  {workspace_item.id === active_workspace?.id && <IconCheck />}
                </div>

                {workspace_item.name}
              </Link>
              {/* <DropdownMenuShortcut>⌘{index + 1}</DropdownMenuShortcut> */}
            </DropdownMenuItem>
          ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
