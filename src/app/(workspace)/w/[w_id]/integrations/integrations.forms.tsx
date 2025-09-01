"use client";

import { Button } from "@/components/ui/button";
import { IconBrandFacebook } from "@tabler/icons-react";
import { useMemo } from "react";

export function ConnectFacebookButton({ wId }: { wId: string }) {
  const href = useMemo(() => `/api/facebook/connect?workspaceId=${wId}`, [wId]);
  return (
    <Button asChild variant="outline" className="gap-2">
      <a href={href}>
        <IconBrandFacebook />
        Connect Facebook
      </a>
    </Button>
  );
}

import { useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { renameWorkspaceAction } from "./integrations.actions";

export function RenameWorkspace({
  wId,
  initialName,
}: {
  wId: string;
  initialName: string;
}) {
  const [name, setName] = useState(initialName);
  const [pending, start] = useTransition();
  const changed = name.trim() !== initialName;

  return (
    <form
      action={() => {
        if (!changed) return;
        start(async () => {
          await renameWorkspaceAction({ w_id: wId, name });
        });
      }}
      className="flex items-center gap-2"
    >
      <Input
        className="w-72"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <Button type="submit" size="sm" disabled={pending || !changed}>
        {pending ? "Saving…" : "Save"}
      </Button>
    </form>
  );
}
