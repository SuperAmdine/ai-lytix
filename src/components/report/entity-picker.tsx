"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type Level = "campaign" | "adset" | "ad";
export interface EntityPickerValue {
  scope: "all" | "selected";
  ids: string[];
}

export function EntityPicker({
  level,
  value,
  onChange,
  parentIds,
  placeholder = "Select…",
}: {
  level: Level;
  value: EntityPickerValue;
  onChange: (v: EntityPickerValue) => void;
  parentIds?: string[];
  placeholder?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const [q, setQ] = React.useState("");
  const [items, setItems] = React.useState<Array<{ id: string; name: string }>>(
    []
  );

  React.useEffect(() => {
    const ac = new AbortController();
    const params = new URLSearchParams({
      level,
      q,
      parentIds: (parentIds || []).join(","),
    });
    fetch(`/api/facebook/entities?${params}`, { signal: ac.signal })
      .then((r) => r.json())
      .then((d) => setItems(d.items ?? []))
      .catch(() => {});
    return () => ac.abort();
  }, [level, q, JSON.stringify(parentIds || [])]);

  const label =
    value.scope === "all"
      ? `All ${level}s`
      : value.ids.length
      ? `${value.ids.length} ${level}(s)`
      : placeholder;

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            {label}
            <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="p-0 w-[420px]">
          <Command>
            <CommandInput
              placeholder={`Search ${level}s…`}
              value={q}
              onValueChange={setQ}
            />
            <CommandList>
              <CommandEmpty>No results.</CommandEmpty>

              <CommandGroup heading="Scope">
                <CommandItem
                  onSelect={() => {
                    onChange({ scope: "all", ids: [] });
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value.scope === "all" ? "opacity-100" : "opacity-0"
                    )}
                  />
                  All {level}s
                </CommandItem>
                <CommandItem
                  onSelect={() => onChange({ scope: "selected", ids: [] })}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value.scope === "selected" ? "opacity-100" : "opacity-0"
                    )}
                  />
                  Select specific…
                </CommandItem>
              </CommandGroup>

              {value.scope === "selected" && (
                <CommandGroup heading={`Choose ${level}s`}>
                  {items.map((it) => {
                    const checked = value.ids.includes(it.id);
                    return (
                      <CommandItem
                        key={it.id}
                        onSelect={() => {
                          onChange({
                            scope: "selected",
                            ids: checked
                              ? value.ids.filter((x) => x !== it.id)
                              : [...value.ids, it.id],
                          });
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            checked ? "opacity-100" : "opacity-0"
                          )}
                        />
                        {it.name ?? it.id}
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {value.scope === "selected" && value.ids.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.ids.map((id) => (
            <Badge
              key={id}
              variant="secondary"
              className="cursor-pointer"
              onClick={() =>
                onChange({
                  scope: "selected",
                  ids: value.ids.filter((x) => x !== id),
                })
              }
            >
              {id}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
