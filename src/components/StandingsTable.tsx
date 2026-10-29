import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import type { StandingRow } from "../types";

export function StandingsTable() {
  const [groupA, setGroupA] = useState<StandingRow[]>([]);
  const [groupB, setGroupB] = useState<StandingRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const calculateStandings = async () => {
    const { data: teams } = await supabase.from("teams").select("id, name");
    const { data: groupMemberships } = await supabase
      .from("group_memberships")
      .select("team_id, group_id, groups(name)");
    const { data: matches } = await supabase
      .from("matches")
      .select("*, match_sets(*)")
      .eq("phase", "group")
      .in("status", ["completed", "walkover"]);

    if (!teams || !groupMemberships) {
      setLoading(false);
      return;
    }

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

    matches?.forEach((m: any) => {
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
        const homeSetsWon = sets.filter((s: any) => s.home_points > s.away_points).length;
        home.classificationPoints += homeSetsWon === 2 ? 3 : 2;
        away.classificationPoints += 1;
      } else if (m.winner === "away") {
        away.wins += 1;
        home.losses += 1;
        const awaySetsWon = sets.filter((s: any) => s.away_points > s.home_points).length;
        away.classificationPoints += awaySetsWon === 2 ? 3 : 2;
        home.classificationPoints += 1;
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

    setGroupA(rows.filter((r) => r.groupId === "A").sort(sortFn));
    setGroupB(rows.filter((r) => r.groupId === "B").sort(sortFn));
    setLoading(false);
  };

  useEffect(() => {
    void calculateStandings();
  }, []);

  if (loading) {
    return <div className="status-message">Calculando tabla de posiciones...</div>;
  }

  const renderTable = (rows: StandingRow[], groupName: string) => (
    <div className="table-wrapper">
      <h3 className="table-group-title">GRUPO {groupName}</h3>
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
    </div>
  );

  return (
    <div className="standings-container">
      {renderTable(groupA, "A")}
      {renderTable(groupB, "B")}
    </div>
  );
}