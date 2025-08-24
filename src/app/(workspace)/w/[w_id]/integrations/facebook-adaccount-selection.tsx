// src/app/(workspace)/w/[w_id]/integrations/_components/save-facebook-selection.tsx
"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { saveFacebookSelectionAction } from "./connections.actions";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type AdAcc = {
  id: string;
  account_id: string;
  name: string;
  currency?: string;
  timezone_name?: string;
};

export function SaveFacebookSelectionForm({
  wId,
  connectionId,
  adAccounts,
  selectedAdAccountId,
}: {
  wId: string;
  connectionId: string;
  adAccounts: AdAcc[];
  selectedAdAccountId?: string;
}) {
  const [value, setValue] = useState<string | undefined>(selectedAdAccountId);
  const [pending, start] = useTransition();

  return (
    <form
      action={() => {
        if (!value) return;
        start(async () => {
          const response = await saveFacebookSelectionAction({
            w_id: wId,
            connectionId: connectionId,
            ad_account_id: value,
          });
          console.log(response);
        });
      }}
      className="grid gap-3"
    >
      <div className="grid gap-2">
        <Label>Facebook Ad Account</Label>
        <Select value={value} onValueChange={setValue}>
          <SelectTrigger className="w-[360px]">
            <SelectValue placeholder="Select an Ad Account" />
          </SelectTrigger>
          <SelectContent>
            {adAccounts.map((a) => (
              <SelectItem key={a.id} value={a.id /* "act_..." id */}>
                {a.name} ({a.account_id}) {a.currency ? `• ${a.currency}` : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex gap-2">
        <Button type="submit" disabled={!value || pending}>
          {pending ? "Saving…" : "Save"}
        </Button>
      </div>
    </form>
  );
}
