"use client";

import { CheckIcon, CopyIcon } from "lucide-react";
import { useState } from "react";

import { Button } from "@/app/components/ui/button";

/**
 * Puts `text` on the clipboard; the label says so for a moment after. With
 * `icon`, only the icon shows, beside a value, and the label is its name.
 */
export function CopyButton({
  text,
  label,
  done,
  icon = false,
}: {
  text: string;
  label: string;
  done: string;
  icon?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  if (icon) {
    return (
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        className="text-muted-foreground"
        aria-label={copied ? done : label}
        title={copied ? done : label}
        onClick={async () => {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }}
      >
        {copied ? <CheckIcon /> : <CopyIcon />}
      </Button>
    );
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
    >
      {copied ? <CheckIcon /> : <CopyIcon />}
      <span aria-live="polite">{copied ? done : label}</span>
    </Button>
  );
}
