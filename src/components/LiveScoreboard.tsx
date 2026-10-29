import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import type { Match } from "../types";

export function LiveScoreboard() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchLiveMatches = async () => {
    const { data, error } = await supabase
      .from("matches")
      .select(`
        *,
        home:teams!home_team_id(id, name),
        away:teams!away_team_id(id, name),
        match_sets(*)
      `)
      .eq("status", "in_progress")
      .order("court_number", { ascending: true });

    if (!error && data) {
      setMatches(data as unknown as Match[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    void fetchLiveMatches();

    const channel = supabase
      .channel("public-realtime-scores")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "match_sets" },
        () => {
          void fetchLiveMatches();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "matches" },
        () => {
          void fetchLiveMatches();
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, []);

  if (loading) {
    return <div className="status-message">Cargando marcadores en vivo...</div>;
  }

  if (matches.length === 0) {
    return (
      <div className="empty-card">
        <span className="empty-icon">🏐</span>
        <h3>No hay partidos en juego en este momento</h3>
        <p>Los marcadores se actualizarán automáticamente tan pronto inicie un encuentro.</p>
      </div>
    );
  }

  return (
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
  );
}