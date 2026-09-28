"use client";

import { useId } from "react";

import { useI18n } from "@/app/i18n/client";
import type { Tenant } from "@/app/lib/api";
import { BuildingIcon, CheckIcon, ChevronsUpDownIcon } from "./icons";
import { usePopover } from "./usePopover";

/**
 * The tenant everything in the dashboard is scoped to. Every account is
 * created with one, so the oldest is the one worked in; choosing another
 * arrives when an account can belong to more than one.
 */
export function TenantSelector({ tenants }: { tenants: Tenant[] }) {
  const { t } = useI18n();
  const copy = t.header.tenant;
  const { open, setOpen, root, trigger } = usePopover();
  const listId = useId();
  const current = tenants[0];
  const label = (tenant: Tenant) => tenant.name ?? copy.unnamed;

  function close() {
    setOpen(false);
    trigger.current?.focus();
  }

  return (
    <div className="popover" ref={root}>
      <button
        ref={trigger}
        type="button"
        className="ghost-trigger"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={copy.label}
        title={current ? label(current) : undefined}
        onClick={() => setOpen(!open)}
      >
        <BuildingIcon />
        <span
          className={
            current?.name ? "ghost-trigger__text" : "ghost-trigger__text ghost-trigger__text--muted"
          }
        >
          {current ? label(current) : copy.none}
        </span>
        <ChevronsUpDownIcon size={14} />
      </button>

      {open && (
        <div className="popover__panel popover__panel--command">
          <ul className="command__list" id={listId} role="listbox" aria-label={copy.label}>
            <li role="presentation" className="popover__label">
              {copy.heading}
            </li>
            {tenants.length === 0 && <li className="command__empty">{copy.empty}</li>}
            {tenants.map((tenant) => (
              <li
                key={tenant.id}
                role="option"
                aria-selected={tenant.id === current?.id}
                className="popover__item"
                onClick={close}
              >
                <span className="popover__check" data-on={tenant.id === current?.id}>
                  <CheckIcon />
                </span>
                {label(tenant)}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
