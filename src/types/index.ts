export type MatchSet = {
  match_id: string;
  set_number: number;
  home_points: number;
  away_points: number;
  closed_at: string | null;
};

export type ScoreEvent = {
  id: string;
  match_id: string;
  set_number: number;
  team: "home" | "away";
  delta: -1 | 1;
  reason: string | null;
  created_at: string;
};

export type MatchLineup = {
  match_id: string;
  set_number: number;
  team: "home" | "away";
  position: number;
  player_id: string;
  initial_position: number;
  current_position: number;
  updated_at: string;
};

export type MatchAlignmentState = {
  match_id: string;
  set_number: number;
  team: "home" | "away";
  server_player_id: string;
  server_position: number;
  is_serving: number;
  rotation_number: number;
  updated_at: string;
};

export type RotationEvent = {
  id: string;
  match_id: string;
  set_number: number;
  team: "home" | "away";
  trigger: "side_out" | "manual";
  from_positions_json: unknown;
  to_positions_json: unknown;
  created_at: string;
};

export type RotationFault = {
  id: string;
  match_id: string;
  set_number: number;
  team: "home" | "away";
  incorrect_server_player_id: string | null;
  incorrect_position: number | null;
  sanction: string;
  reason: string;
  awarded_to: "home" | "away" | null;
  sanction_applied: boolean;
  occurred_at: string | null;
  points_to_annul_json: unknown;
  correction_of_id: string | null;
  created_at: string;
};

export type SubstitutionEvent = {
  id: string;
  match_id: string;
  set_number: number;
  team: "home" | "away";
  player_out_id: string;
  player_in_id: string;
  position: number;
  rotation_number: number;
  score_home: number;
  score_away: number;
  occurred_at: string;
  corrects_event_id: string | null;
  created_at: string;
};

export type MatchTimeout = {
  match_id: string;
  set_number: number;
  team: "home" | "away";
  used_at: string;
};

export type PlayerInfo = {
  id: string;
  name: string;
  jersey_number: number | null;
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