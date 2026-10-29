export type MatchSet = {
  match_id: string;
  set_number: number;
  home_points: number;
  away_points: number;
  closed_at: string | null;
};

export type TeamInfo = {
  id: string;
  name: string;
};

export type Match = {
  id: string;
  tournament_id: string;
  phase: "group" | "knockout";
  group_id: string | null;
  home_team_id: string;
  away_team_id: string;
  court_number: number | null;
  status: "scheduled" | "in_progress" | "completed" | "walkover";
  winner: "home" | "away" | null;
  current_set: number;
  home?: TeamInfo;
  away?: TeamInfo;
  match_sets?: MatchSet[];
};

export type StandingRow = {
  teamId: string;
  teamName: string;
  groupId: "A" | "B";
  matchesPlayed: number;
  wins: number;
  losses: number;
  classificationPoints: number;
  pointsFor: number;
  pointsAgainst: number;
  pointDifferential: number;
};