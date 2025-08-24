// src/app/(workspace)/w/[w_id]/integrations/_components/rename-workspace.tsx
"use client";

import { useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { renameWorkspaceAction } from "./connections.actions";

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
