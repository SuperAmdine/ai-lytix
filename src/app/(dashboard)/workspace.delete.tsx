// src/app/(dashboard)/workspaces/_components/delete-workspace-confirm.tsx
"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Trash2 } from "lucide-react";

export function DeleteWorkspaceConfirm({
  id,
  name,
  size = "sm",
}: {
  id: string;
  name?: string;
  size?: "sm" | "default" | "lg" | "icon";
}) {
  const [pending, start] = useTransition();

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          size={size}
          variant="destructive"
          className="gap-1"
          disabled={pending}
        >
          <Trash2 className="size-4" />
          Delete
        </Button>
      </AlertDialogTrigger>

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete workspace?</AlertDialogTitle>
          <AlertDialogDescription>
            {name ? (
              <>
                You’re about to delete <b>{name}</b>. This action cannot be
                undone.
              </>
            ) : (
              <>This action cannot be undone.</>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>

          {/* Submit to server action on confirm */}
          <form
            action={(formData) => {
              start(async () => {
                const mod = await import("./workspace.actions");
                await mod.deleteWorkspaceAction(null, formData);
              });
            }}
          >
            <input type="hidden" name="id" value={id} />
            <AlertDialogAction asChild>
              <Button type="submit" variant="destructive" disabled={pending}>
                {pending ? "Deleting…" : "Delete"}
              </Button>
            </AlertDialogAction>
          </form>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
