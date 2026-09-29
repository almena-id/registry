"use client";

import { Button } from "@/app/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu";

export type Choice<T extends string> = {
  value: T;
  label: string;
  icon?: React.ReactNode;
  lang?: string;
};

/**
 * A ghost trigger with an icon and the current choice, opening a titled,
 * checked list (almena-id/frontend's dropdown shape). `above` opens it over
 * the trigger, for the footer.
 */
export function ChoiceMenu<T extends string>({
  label,
  icon,
  value,
  choices,
  onSelect,
  disabled,
  placement = "below",
}: {
  label: string;
  icon: React.ReactNode;
  value: T;
  choices: Choice<T>[];
  onSelect: (value: T) => void;
  disabled?: boolean;
  placement?: "below" | "above";
}) {
  const current = choices.find((choice) => choice.value === value);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" aria-label={label} disabled={disabled}>
          <span className="text-muted-foreground">{current?.icon ?? icon}</span>
          {current?.label}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        side={placement === "above" ? "top" : "bottom"}
        align="end"
        className="w-44"
      >
        <DropdownMenuLabel className="text-xs text-muted-foreground">{label}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup
          value={value}
          onValueChange={(next) => {
            if (next !== value) onSelect(next as T);
          }}
        >
          {choices.map((choice) => (
            <DropdownMenuRadioItem key={choice.value} value={choice.value} lang={choice.lang}>
              {choice.icon}
              {choice.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
