import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { PUBLIC_TOURNAMENT_ID } from "../lib/tournament";
import type { Match } from "../types";
import { ReadError, RealtimeStatus } from "./RealtimeStatus";
import { usePublicRealtime } from "../lib/usePublicRealtime";
import { MatchDetails } from "./MatchDetails";
import { getDisplaySetScore, getSetLabel } from "../lib/matchFormat";

const scheduleSubscriptions = [
  { table: "matches", filter: `tournament_id=eq.${PUBLIC_TOURNAMENT_ID}` },
  { table: "match_sets" },
];

export function ScheduleList() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedMatchId, setExpandedMatchId] = useState<string | null>(null);

  const fetchSchedule = useCallback(async () => {
    const { data, error } = await supabase
      .from("matches")
      .select(`
        *,
        home:teams!home_team_id(name),
        away:teams!away_team_id(name),
        match_sets(*)
      `)
      .eq("tournament_id", PUBLIC_TOURNAMENT_ID)
      .order("court_number", { ascending: true });

    if (error) {
      setError(error.message);
    } else if (data) {
      setMatches(data as unknown as Match[]);
      setError(null);
    }
    setLoading(false);
  }, []);

  const realtimeStatus = usePublicRealtime({
    channelName: "public-realtime-schedule",
    subscriptions: scheduleSubscriptions,
    onRefresh: fetchSchedule,
  });

  useEffect(() => {
    void fetchSchedule();
  }, [fetchSchedule]);

  if (loading) {
    return (
      <>
        <RealtimeStatus status={realtimeStatus} />
        <div className="status-message">Cargando programación de partidos...</div>
      </>
    );
  }

  if (error && matches.length === 0) {
    return (
      <>
        <RealtimeStatus status={realtimeStatus} />
        <ReadError message={error} onRetry={() => void fetchSchedule()} />
      </>
    );
  }

  if (matches.length === 0) {
    return (
      <>
        <RealtimeStatus status={realtimeStatus} />
        {error && <ReadError message={error} onRetry={() => void fetchSchedule()} />}
        <div className="empty-card">
          <span className="empty-icon">📅</span>
          <h3>El calendario todavía está vacío</h3>
          <p>Los partidos aparecerán aquí cuando se publique la programación.</p>
        </div>
      </>
    );
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
    <>
      <RealtimeStatus status={realtimeStatus} />
      {error && <ReadError message={error} onRetry={() => void fetchSchedule()} />}
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
                  .map((s) => {
                    const displayedScore = getDisplaySetScore(m, s);
                    return (
                      <span key={s.set_number} className="set-score-chip">
                        {getSetLabel(m, s.set_number)}: {displayedScore.home_points}-{displayedScore.away_points}
                      </span>
                    );
                  })}
              </div>
            )}
            <button className="details-toggle" onClick={() => setExpandedMatchId((current) => current === m.id ? null : m.id)}>
              {expandedMatchId === m.id ? "Ocultar seguimiento" : "Ver seguimiento del partido"}
            </button>
            {expandedMatchId === m.id && <MatchDetails match={m} />}
          </div>
        ))}
      </div>
    </>
  );
}