"use client";

import { useState } from "react";

/**
 * A number that changes with every answer a form action gives (`state`, from
 * `useActionState`). Key a form's selects (`Select`, `<select>`) with it.
 *
 * After an action React resets the form's fields to their defaults. An input
 * takes its new `defaultValue` along, but a select resets to the option it was
 * mounted with: without a new key it shows the first value again, not the one
 * just saved.
 */
export function useAnswerRound(state: unknown): number {
  const [answered, setAnswered] = useState(state);
  const [round, setRound] = useState(0);
  if (answered !== state) {
    setAnswered(state);
    setRound(round + 1);
  }
  return round;
}
