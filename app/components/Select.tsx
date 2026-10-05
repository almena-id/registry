"use client";

import { useState } from "react";

import {
  Select as Root,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import { cn } from "cn";

export type SelectOption = { value: string; label: string };

// Radix keeps "" for "nothing chosen"; the empty choice travels under this.
const EMPTY = "__none__";

/**
 * A form field's list of choices: shadcn's Select. The value travels in a
 * hidden input under `name`, so a form reads it as it read a `<select>`, the
 * empty choice ("None", "Not configured") as "". It is uncontrolled like one:
 * key it with `useAnswerRound` to take a new `defaultValue` after an action.
 */
export function Select({
  id,
  name,
  options,
  defaultValue = "",
  disabled,
  onChange,
  "aria-invalid": invalid,
  "aria-describedby": describedBy,
}: {
  id: string;
  name: string;
  options: SelectOption[];
  defaultValue?: string;
  disabled?: boolean;
  onChange?: (value: string) => void;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
}) {
  const [value, setValue] = useState(defaultValue);

  return (
    <>
      <input type="hidden" name={name} value={value} />
      <Root
        value={value || EMPTY}
        disabled={disabled}
        onValueChange={(next) => {
          const chosen = next === EMPTY ? "" : next;
          setValue(chosen);
          onChange?.(chosen);
        }}
      >
        <SelectTrigger
          id={id}
          className={cn("w-full", !value && "text-muted-foreground")}
          aria-invalid={invalid}
          aria-describedby={describedBy}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent position="popper">
          {options.map((option) => (
            <SelectItem
              key={option.value || EMPTY}
              value={option.value || EMPTY}
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Root>
    </>
  );
}
