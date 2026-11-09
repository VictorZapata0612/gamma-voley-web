import type { Match, MatchSet } from "../types";

const PROLONGATION_BASE = 15;

export function getSetLabel(match: Pick<Match, "phase">, setNumber: number): string {
  return match.phase === "group" && setNumber === 3
    ? "Prolongación del set 2"
    : `Set ${setNumber}`;
}

export function getDisplaySetScore(
  match: Pick<Match, "phase">,
  set: Pick<MatchSet, "set_number" | "home_points" | "away_points">
): Pick<MatchSet, "home_points" | "away_points"> {
  if (match.phase !== "group" || set.set_number !== 3) {
    return { home_points: set.home_points, away_points: set.away_points };
  }

  return {
    home_points: set.home_points + PROLONGATION_BASE,
    away_points: set.away_points + PROLONGATION_BASE,
  };
}
