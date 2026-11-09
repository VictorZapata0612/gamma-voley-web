import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { PUBLIC_TOURNAMENT_ID } from "../lib/tournament";
import type { Match } from "../types";
import { ReadError, RealtimeStatus } from "./RealtimeStatus";
import { usePublicRealtime } from "../lib/usePublicRealtime";

const liveSubscriptions = [
  { table: "match_sets" },
  { table: "matches", filter: `tournament_id=eq.${PUBLIC_TOURNAMENT_ID}` },
];

export function LiveScoreboard() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLiveMatches = useCallback(async () => {
    const { data, error } = await supabase
      .from("matches")
      .select(`
        *,
        home:teams!home_team_id(id, name),
        away:teams!away_team_id(id, name),
        match_sets(*)
      `)
      .eq("tournament_id", PUBLIC_TOURNAMENT_ID)
      .eq("status", "in_progress")
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
    channelName: "public-realtime-scores",
    subscriptions: liveSubscriptions,
    onRefresh: fetchLiveMatches,
  });

  useEffect(() => {
    void fetchLiveMatches();
  }, [fetchLiveMatches]);

  if (loading) {
    return (
      <>
        <RealtimeStatus status={realtimeStatus} />
        <div className="status-message">Cargando marcadores en vivo...</div>
      </>
    );
  }

  if (error && matches.length === 0) {
    return (
      <>
        <RealtimeStatus status={realtimeStatus} />
        <ReadError message={error} onRetry={() => void fetchLiveMatches()} />
      </>
    );
  }

  if (matches.length === 0) {
    return (
      <>
        <RealtimeStatus status={realtimeStatus} />
        {error && <ReadError message={error} onRetry={() => void fetchLiveMatches()} />}
        <div className="empty-card">
          <span className="empty-icon">🏐</span>
          <h3>No hay partidos en juego en este momento</h3>
          <p>Los marcadores se actualizarán automáticamente tan pronto inicie un encuentro.</p>
        </div>
      </>
    );
  }

  return (
    <>
      <RealtimeStatus status={realtimeStatus} />
      {error && <ReadError message={error} onRetry={() => void fetchLiveMatches()} />}
      <div className="live-grid">
        {matches.map((match) => {
        const currentSetData = match.match_sets?.find(
          (s) => s.set_number === match.current_set
        );

          return (
            <div key={match.id} className="scoreboard-card">
            <div className="card-header">
              <span className="live-badge">
                <span className="pulse-dot"></span> EN VIVO · CANCHA {match.court_number ?? 1}
              </span>
              <span className="set-badge">SET {match.current_set}</span>
            </div>

            <div className="match-teams-row">
              <div className="team-col">
                <h3 className="team-name">{match.home?.name ?? "Local"}</h3>
                <span className="score-number">{currentSetData?.home_points ?? 0}</span>
              </div>
              <div className="vs-divider">VS</div>
              <div className="team-col">
                <h3 className="team-name">{match.away?.name ?? "Visitante"}</h3>
                <span className="score-number">{currentSetData?.away_points ?? 0}</span>
              </div>
            </div>

            {match.match_sets && match.match_sets.length > 0 && (
              <div className="sets-history">
                {match.match_sets
                  .sort((a, b) => a.set_number - b.set_number)
                  .map((s) => (
                    <span key={s.set_number} className={`set-pill ${s.set_number === match.current_set ? "active" : ""}`}>
                      S{s.set_number}: {s.home_points} - {s.away_points}
                    </span>
                  ))}
              </div>
            )}
            </div>
          );
        })}
      </div>
    </>
  );
}