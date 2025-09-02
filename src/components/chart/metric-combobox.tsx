// src/components/metrics/MetricCombobox.tsx
"use client";

import * as React from "react";
import { Check, ChevronsUpDown, Filter } from "lucide-react";
import { cn } from "@/lib/utils"; // or your own cn()
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";

type CatalogResponse = {
  provider: "facebook";
  categories: Array<{
    category: string;
    items: Array<{ key: string; label: string; unit: string; type: "raw" | "derived" }>;
  }>;
  meta: Record<
    string,
    { unit: "count" | "currency" | "rate" | "cost_per"; type: "raw" | "derived"; requiresDenominator: boolean; allowedDenominators: string[] }
  >;
};

export type MetricValue = { key: string; denominator?: string } | null;

const UNIT_LABEL: Record<CatalogResponse["meta"][string]["unit"], string> = {
  count: "count",
  currency: "currency",
  rate: "rate",
  cost_per: "cost",
};

function UnitBadge({ unit }: { unit: CatalogResponse["meta"][string]["unit"] }) {
  return <Badge variant="outline" className="text-[10px] px-1 py-0">{UNIT_LABEL[unit]}</Badge>;
}

export function MetricCombobox({
  value,
  onChange,
  placeholder = "Select a metric…",
  emptyText = "No metrics found.",
  className,
}: {
  value: MetricValue;
  onChange: (next: MetricValue) => void;
  placeholder?: string;
  emptyText?: string;
  className?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const [q, setQ] = React.useState("");
  const [catalog, setCatalog] = React.useState<CatalogResponse | null>(null);

  React.useEffect(() => {
    let alive = true;
    (async () => {
      const r = await fetch("/api/metrics/catalog", { cache: "no-store" });
      const j = (await r.json()) as CatalogResponse;
      if (alive) setCatalog(j);
    })();
    return () => { alive = false; };
  }, []);

  const allItems = React.useMemo(() => {
    if (!catalog) return [];
    return catalog.categories.flatMap(g =>
      g.items.map(it => ({
        ...it,
        category: g.category,
        unit: catalog.meta[it.key]?.unit ?? "count",
        requiresDenominator: catalog.meta[it.key]?.requiresDenominator ?? false,
        allowedDenominators: catalog.meta[it.key]?.allowedDenominators ?? [],
      }))
    );
  }, [catalog]);

  const groups = React.useMemo(() => {
    const m = new Map<string, typeof allItems>();
    for (const it of allItems) {
      if (!m.has(it.category)) m.set(it.category, []);
      m.get(it.category)!.push(it);
    }
    for (const [, arr] of m) arr.sort((a, b) => a.label.localeCompare(b.label));
    return Array.from(m.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [allItems]);

  const selected = React.useMemo(
    () => (value ? allItems.find(m => m.key === value.key) ?? null : null),
    [value, allItems]
  );

  function pickMetric(it: (typeof allItems)[number]) {
    const denom = it.requiresDenominator ? value?.denominator ?? it.allowedDenominators[0] : undefined;
    onChange({ key: it.key, denominator: denom });
    setOpen(false);
  }

  const filteredGroups = React.useMemo(() => {
    if (!q) return groups;
    const needle = q.toLowerCase();
    return groups
      .map(([cat, arr]) => [cat, arr.filter(m => m.label.toLowerCase().includes(needle) || m.key.toLowerCase().includes(needle))] as const)
      .filter(([, arr]) => arr.length > 0);
  }, [groups, q]);

  const showDenom = !!(selected && selected.requiresDenominator);

  return (
    <div className={cn("w-full", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between">
            <div className="truncate text-left">
              {selected ? (
                <span className="inline-flex items-center gap-2">
                  <span>{selected.label}</span>
                  <UnitBadge unit={selected.unit as any} />
                </span>
              ) : (
                <span className="text-muted-foreground">{placeholder}</span>
              )}
            </div>
            <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
          </Button>
        </PopoverTrigger>

        <PopoverContent align="start" className="p-0 w-[420px]">
          <Command shouldFilter={false}>
            <div className="flex items-center gap-2 p-2">
              <Filter className="h-4 w-4 opacity-60" />
              <CommandInput value={q} onValueChange={setQ} placeholder="Search metrics…" className="h-8" />
            </div>
            <CommandList>
              <CommandEmpty>{emptyText}</CommandEmpty>
              <ScrollArea className="max-h-72">
                {filteredGroups.map(([cat, arr]) => (
                  <CommandGroup key={cat} heading={cat}>
                    {arr.map((m) => (
                      <CommandItem
                        key={m.key}
                        value={m.key}
                        onSelect={() => pickMetric(m)}
                        className="flex items-center justify-between"
                      >
                        <div className="min-w-0">
                          <div className="truncate">{m.label}</div>
                          <div className="text-[11px] text-muted-foreground truncate">{m.key}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <UnitBadge unit={m.unit as any} />
                          <Check className={cn("ml-1 h-4 w-4", value?.key === m.key ? "opacity-100" : "opacity-0")} />
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                ))}
              </ScrollArea>
              <CommandSeparator />
              <div className="p-2 text-[11px] text-muted-foreground">
                {selected ? <>Selected: <strong>{selected.label}</strong></> : <>Pick a metric to continue.</>}
              </div>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {showDenom && (
        <div className="mt-2">
          <Label className="text-xs">Result type</Label>
          <div className="mt-1">
            <select
              className="w-full h-9 rounded-md border px-2 text-sm"
              value={value?.denominator ?? selected?.allowedDenominators?.[0] ?? ""}
              onChange={(e) => onChange({ key: selected!.key, denominator: e.target.value })}
            >
              {(selected?.allowedDenominators ?? []).map((d) => (
                <option key={d} value={d}>{d.replaceAll("_", " ")}</option>
              ))}
            </select>
          </div>
        </div>
      )}
    </div>
  );
}