import type { Match } from "../types";

export function getSetLabel(match: Pick<Match, "phase">, setNumber: number): string {
  return match.phase === "group" && setNumber === 3
    ? "Prolongación del set 2"
    : `Set ${setNumber}`;
}
