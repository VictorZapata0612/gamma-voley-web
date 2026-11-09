import type { MatchSet } from "../types";

type MatchWinner = "home" | "away";

export function getClassificationPoints(
  sets: MatchSet[],
  winner: MatchWinner,
): { winner: number; loser: number } {
  const regularSets = sets.filter((set) => set.set_number === 1 || set.set_number === 2);
  const homeSetsWon = regularSets.filter((set) => set.home_points > set.away_points).length;
  const awaySetsWon = regularSets.filter((set) => set.away_points > set.home_points).length;
  const winnerSetsWon = winner === "home" ? homeSetsWon : awaySetsWon;

  return winnerSetsWon === 2 ? { winner: 3, loser: 0 } : { winner: 2, loser: 1 };
}
