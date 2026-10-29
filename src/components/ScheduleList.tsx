import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import type { Match } from "../types";

export function ScheduleList() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchSchedule = async () => {
    const { data, error } = await supabase
      .from("matches")
      .select(`
        *,
        home:teams!home_team_id(name),
        away:teams!away_team_id(name),
        match_sets(*)
      `)
      .order("court_number", { ascending: true });

    if (!error && data) {
      setMatches(data as unknown as Match[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    void fetchSchedule();
  }, []);

  if (loading) {
    return <div className="status-message">Cargando programación de partidos...</div>;
  }

  const statusLabel = (status: Match["status"]) => {
    switch (status) {
      case "in_progress":
        return <span className="status-pill in-prog">EN JUEGO</span>;
      case "completed":
        return <span className="status-pill comp">FINALIZADO</span>;
      case "walkover":
        return <span className="status-pill wo">WALKOVER</span>;
      default:
        return <span className="status-pill sched">PROGRAMADO</span>;
    }
  };

  return (
    <div className="schedule-list">
      {matches.map((m) => (
        <div key={m.id} className="schedule-card">
          <div className="schedule-header">
            <span className="court-tag">CANCHA {m.court_number ?? 1}</span>
            {statusLabel(m.status)}
          </div>
          <div className="schedule-teams">
            <span className={`team-label ${m.winner === "home" ? "winner" : ""}`}>
              {m.home?.name}
            </span>
            <span className="vs-tag">VS</span>
            <span className={`team-label ${m.winner === "away" ? "winner" : ""}`}>
              {m.away?.name}
            </span>
          </div>
          {m.match_sets && m.match_sets.length > 0 && (
            <div className="schedule-sets">
              {m.match_sets
                .sort((a, b) => a.set_number - b.set_number)
                .map((s) => (
                  <span key={s.set_number} className="set-score-chip">
                    S{s.set_number}: {s.home_points}-{s.away_points}
                  </span>
                ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}