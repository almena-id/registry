"use client";

import { BuildingIcon, CheckIcon, ChevronsUpDownIcon } from "lucide-react";
import { useState, useTransition } from "react";

import { Button } from "@/app/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/app/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/app/components/ui/popover";
import { useI18n } from "@/app/i18n/client";
import type { Tenant } from "@/app/lib/api";
import { chooseTenant } from "@/app/lib/tenant-actions";
import { cn } from "@/app/lib/utils";

/**
 * The tenant everything in the dashboard is scoped to. An account belongs to
 * one or more (its own, and those it was invited to); choosing one keeps it
 * in a cookie and goes back to the overview.
 */
export function TenantSelector({
  tenants,
  current,
}: {
  tenants: Tenant[];
  current: Tenant | null;
}) {
  const { t } = useI18n();
  const copy = t.header.tenant;
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const label = (tenant: Tenant) => tenant.name ?? copy.unnamed;

  function choose(tenant: Tenant) {
    setOpen(false);
    if (tenant.id === current?.id) return;
    startTransition(() => chooseTenant(tenant.id));
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          role="combobox"
          aria-expanded={open}
          aria-label={copy.label}
          aria-busy={pending}
          title={current ? label(current) : undefined}
        >
          <BuildingIcon className="text-muted-foreground" />
          <span
            className={cn(
              "hidden max-w-48 truncate sm:inline",
              !current?.name && "text-muted-foreground",
            )}
          >
            {current ? label(current) : copy.none}
          </span>
          <ChevronsUpDownIcon className="size-3.5 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 p-0">
        <Command>
          <CommandList>
            <CommandEmpty>{copy.empty}</CommandEmpty>
            <CommandGroup heading={copy.heading}>
              {tenants.map((tenant) => (
                <CommandItem
                  key={tenant.id}
                  value={tenant.id}
                  keywords={[label(tenant)]}
                  onSelect={() => choose(tenant)}
                >
                  <CheckIcon
                    className={cn(
                      "text-primary",
                      tenant.id === current?.id ? "opacity-100" : "opacity-0",
                    )}
                  />
                  {label(tenant)}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
