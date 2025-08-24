// src/app/(workspace)/w/[w_id]/integrations/_components/connect-facebook.tsx
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
