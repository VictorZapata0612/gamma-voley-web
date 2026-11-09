import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { PUBLIC_TOURNAMENT_ID } from "../lib/tournament";
import { getClassificationPoints } from "../lib/standings";
import type { StandingRow } from "../types";
import { ReadError, RealtimeStatus } from "./RealtimeStatus";
import { usePublicRealtime } from "../lib/usePublicRealtime";

const standingsSubscriptions = [
  { table: "matches", filter: `tournament_id=eq.${PUBLIC_TOURNAMENT_ID}` },
  { table: "match_sets" },
  { table: "qualification_resolutions", filter: `tournament_id=eq.${PUBLIC_TOURNAMENT_ID}` },
];

type QualificationResolution = {
  id: string;
  group_id: string;
  affected_team_ids: string[];
  qualified_team_id: string;
  criterion: string;
  decided_by: string;
  decided_at: string;
};

export function StandingsTable() {
  const [groupA, setGroupA] = useState<StandingRow[]>([]);
  const [groupB, setGroupB] = useState<StandingRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [resolutions, setResolutions] = useState<QualificationResolution[]>([]);

  const calculateStandings = useCallback(async () => {
    const [teamsResult, membershipsResult, matchesResult, resolutionsResult] = await Promise.all([
      supabase
        .from("teams")
        .select("id, name")
        .eq("tournament_id", PUBLIC_TOURNAMENT_ID),
      supabase
        .from("group_memberships")
        .select("team_id, group_id, groups!inner(name, tournament_id)")
        .eq("groups.tournament_id", PUBLIC_TOURNAMENT_ID),
      supabase
        .from("matches")
        .select("*, match_sets(*)")
        .eq("phase", "group")
        .eq("tournament_id", PUBLIC_TOURNAMENT_ID)
        .in("status", ["completed", "walkover"]),
      supabase
        .from("qualification_resolutions")
        .select("id, group_id, affected_team_ids, qualified_team_id, criterion, decided_by, decided_at")
        .eq("tournament_id", PUBLIC_TOURNAMENT_ID),
    ]);

    const readError =
      teamsResult.error ?? membershipsResult.error ?? matchesResult.error ?? resolutionsResult.error;
    if (readError) {
      setError(readError.message);
      setLoading(false);
      return;
    }

    const teams = teamsResult.data ?? [];
    const groupMemberships = membershipsResult.data ?? [];
    const matches = matchesResult.data ?? [];
    const remoteResolutions = (resolutionsResult.data ?? []) as QualificationResolution[];

    const map = new Map<string, StandingRow>();

    groupMemberships.forEach((gm: any) => {
      const team = teams.find((t) => t.id === gm.team_id);
      const groupName = gm.groups?.name as "A" | "B";
      if (team && groupName) {
        map.set(team.id, {
          teamId: team.id,
          teamName: team.name,
          groupId: groupName,
          matchesPlayed: 0,
          wins: 0,
          losses: 0,
          classificationPoints: 0,
          pointsFor: 0,
          pointsAgainst: 0,
          pointDifferential: 0,
        });
      }
    });

    matches.forEach((m: any) => {
      const home = map.get(m.home_team_id);
      const away = map.get(m.away_team_id);
      if (!home || !away) return;

      const sets = m.match_sets || [];
      const homeFor = sets.reduce((sum: number, s: any) => sum + (s.home_points || 0), 0);
      const awayFor = sets.reduce((sum: number, s: any) => sum + (s.away_points || 0), 0);

      home.matchesPlayed += 1;
      away.matchesPlayed += 1;
      home.pointsFor += homeFor;
      home.pointsAgainst += awayFor;
      away.pointsFor += awayFor;
      away.pointsAgainst += homeFor;

      if (m.status === "walkover") {
        const winner = m.winner === "home" ? home : away;
        const loser = m.winner === "home" ? away : home;
        winner.wins += 1;
        winner.classificationPoints += 3;
        loser.losses += 1;
      } else if (m.winner === "home") {
        home.wins += 1;
        away.losses += 1;
        const points = getClassificationPoints(sets, "home");
        home.classificationPoints += points.winner;
        away.classificationPoints += points.loser;
      } else if (m.winner === "away") {
        away.wins += 1;
        home.losses += 1;
        const points = getClassificationPoints(sets, "away");
        away.classificationPoints += points.winner;
        home.classificationPoints += points.loser;
      }

      home.pointDifferential = home.pointsFor - home.pointsAgainst;
      away.pointDifferential = away.pointsFor - away.pointsAgainst;
    });

    const rows = Array.from(map.values());
    const sortFn = (a: StandingRow, b: StandingRow) => {
      if (b.classificationPoints !== a.classificationPoints) {
        return b.classificationPoints - a.classificationPoints;
      }
      return b.pointDifferential - a.pointDifferential;
    };

    const applyResolution = (groupRows: StandingRow[], groupId: "A" | "B") => {
      const resolution = remoteResolutions.find((item) => item.group_id.endsWith(`-${groupId.toLowerCase()}`));
      if (!resolution || resolution.affected_team_ids.length !== 2) return groupRows;
      const selectedIndex = groupRows.findIndex((row) => row.teamId === resolution.qualified_team_id);
      const otherIndex = groupRows.findIndex(
        (row) => resolution.affected_team_ids.includes(row.teamId) && row.teamId !== resolution.qualified_team_id,
      );
      if (selectedIndex < 0 || otherIndex < 0 || Math.min(selectedIndex, otherIndex) > 1) return groupRows;
      const reordered = [...groupRows];
      const selected = reordered.splice(selectedIndex, 1)[0];
      reordered.splice(Math.min(selectedIndex, otherIndex), 0, selected);
      return reordered;
    };

    setGroupA(applyResolution(rows.filter((r) => r.groupId === "A").sort(sortFn), "A"));
    setGroupB(applyResolution(rows.filter((r) => r.groupId === "B").sort(sortFn), "B"));
    setResolutions(remoteResolutions);
    setError(null);
    setLoading(false);
  }, []);

  const realtimeStatus = usePublicRealtime({
    channelName: "public-realtime-standings",
    subscriptions: standingsSubscriptions,
    onRefresh: calculateStandings,
  });

  useEffect(() => {
    void calculateStandings();
  }, [calculateStandings]);

  if (loading) {
    return (
      <>
        <RealtimeStatus status={realtimeStatus} />
        <div className="status-message">Calculando tabla de posiciones...</div>
      </>
    );
  }

  if (error && groupA.length === 0 && groupB.length === 0) {
    return (
      <>
        <RealtimeStatus status={realtimeStatus} />
        <ReadError message={error} onRetry={() => void calculateStandings()} />
      </>
    );
  }

  const renderTable = (rows: StandingRow[], groupName: string) => (
    <div className="table-wrapper">
      <h3 className="table-group-title">GRUPO {groupName}</h3>
      {rows.length === 0 ? (
        <p className="table-empty">Aún no hay equipos registrados en este grupo.</p>
      ) : (
        <>
        {resolutions.find((resolution) => resolution.group_id.endsWith(`-${groupName.toLowerCase()}`)) && (
          <div className="official-resolution" role="status">
            <strong>✓ Clasificación resuelta oficialmente</strong>
            <span>
              Equipo clasificado: {rows.find((row) => row.teamId === resolutions.find((resolution) => resolution.group_id.endsWith(`-${groupName.toLowerCase()}`))?.qualified_team_id)?.teamName ?? "registrado"}.
              Criterio: {resolutions.find((resolution) => resolution.group_id.endsWith(`-${groupName.toLowerCase()}`))?.criterion}
            </span>
          </div>
        )}
        <table className="standings-table">
          <thead>
            <tr>
              <th>Equipo</th>
              <th>PJ</th>
              <th>PG</th>
              <th>PP</th>
              <th>PTS</th>
              <th>DIFF</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, idx) => (
              <tr key={r.teamId} className={idx < 2 ? "qualified-row" : ""}>
                <td className="team-cell">
                  {idx < 2 && <span className="qual-dot" title="Zona de clasificación"></span>}
                  {r.teamName}
                </td>
                <td>{r.matchesPlayed}</td>
                <td>{r.wins}</td>
                <td>{r.losses}</td>
                <td className="points-cell">{r.classificationPoints}</td>
                <td className={r.pointDifferential >= 0 ? "pos-diff" : "neg-diff"}>
                  {r.pointDifferential > 0 ? `+${r.pointDifferential}` : r.pointDifferential}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </>
      )}
    </div>
  );

  return (
    <>
      <RealtimeStatus status={realtimeStatus} />
      {error && <ReadError message={error} onRetry={() => void calculateStandings()} />}
      <div className="standings-container">
        {renderTable(groupA, "A")}
        {renderTable(groupB, "B")}
      </div>
    </>
  );
}