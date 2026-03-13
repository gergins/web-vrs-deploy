import { createId } from "./ids";

export function getCorrelationId(input?: string | null) {
  if (input && input.length > 0) {
    return input;
  }

  return createId();
}
