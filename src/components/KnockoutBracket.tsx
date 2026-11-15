import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
import { PUBLIC_TOURNAMENT_ID } from "../lib/tournament";
import type { Match } from "../types";
import { usePublicRealtime } from "../lib/usePublicRealtime";
import { ReadError, RealtimeStatus } from "./RealtimeStatus";
import { getDisplaySetScore, getSetLabel } from "../lib/matchFormat";

const bracketSubscriptions = [
  { table: "matches", filter: `tournament_id=eq.${PUBLIC_TOURNAMENT_ID}` },
  { table: "match_sets" },
];

const bracketRounds = [
  { id: "sf-1", label: "Semifinal 1" },
  { id: "sf-2", label: "Semifinal 2" },
  { id: "final", label: "Gran final" },
] as const;

type BracketRoundId = (typeof bracketRounds)[number]["id"];

export function KnockoutBracket() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBracket = useCallback(async () => {
    const { data, error: queryError } = await supabase
      .from("matches")
      .select(`
        *,
        home:teams!home_team_id(name),
        away:teams!away_team_id(name),
        match_sets(*)
      `)
      .eq("tournament_id", PUBLIC_TOURNAMENT_ID)
      .eq("phase", "knockout");

    if (queryError) {
      setError(queryError.message);
    } else {
      setMatches((data ?? []) as unknown as Match[]);
      setError(null);
    }
    setLoading(false);
  }, []);

  const realtimeStatus = usePublicRealtime({
    channelName: "public-realtime-knockout-bracket",
    subscriptions: bracketSubscriptions,
    onRefresh: fetchBracket,
  });

  useEffect(() => {
    void fetchBracket();
  }, [fetchBracket]);

  const matchesById = useMemo(
    () => new Map(matches.map((match) => [match.id, match] as const)),
    [matches],
  );
  const extraMatches = matches.filter(
    (match) => !bracketRounds.some((round) => round.id === match.id),
  );

  const renderRound = (id: BracketRoundId, label: string) => {
    const match = matchesById.get(id);

    if (!match) {
      const isFinal = id === "final";
      return (
        <article className={`bracket-card bracket-placeholder${isFinal ? " bracket-card-final" : ""}`} key={id}>
          <div className="bracket-card-header">
            <span className="bracket-round-label">{label}</span>
            <span className="status-pill sched">PENDIENTE</span>
          </div>
          <div className="bracket-team-row">
            <span>{isFinal ? "Ganador semifinal 1" : "Equipo clasificado"}</span>
          </div>
          <div className="bracket-team-row">
            <span>{isFinal ? "Ganador semifinal 2" : "Equipo clasificado"}</span>
          </div>
          <p className="bracket-pending-note">
            {matches.length === 0
              ? "Se mostrará cuando la app genere esta fase."
              : "Pendiente de que finalice la ronda anterior."}
          </p>
        </article>
      );
    }

    const sortedSets = [...(match.match_sets ?? [])].sort(
      (a, b) => a.set_number - b.set_number,
    );

    return (
      <article className={`bracket-card${id === "final" ? " bracket-card-final" : ""}`} key={id}>
        <div className="bracket-card-header">
          <span className="bracket-round-label">{label}</span>
          {match.status === "in_progress" ? (
            <span className="status-pill in-prog">EN JUEGO</span>
          ) : match.status === "completed" ? (
            <span className="status-pill comp">FINALIZADO</span>
          ) : match.status === "walkover" ? (
            <span className="status-pill wo">WALKOVER</span>
          ) : (
            <span className="status-pill sched">PROGRAMADO</span>
          )}
        </div>
        <div className={`bracket-team-row${match.winner === "home" ? " bracket-winner" : ""}`}>
          <span>{match.home?.name ?? "Por definir"}</span>
          {match.winner === "home" && <span className="bracket-winner-mark">Ganador</span>}
        </div>
        <div className={`bracket-team-row${match.winner === "away" ? " bracket-winner" : ""}`}>
          <span>{match.away?.name ?? "Por definir"}</span>
          {match.winner === "away" && <span className="bracket-winner-mark">Ganador</span>}
        </div>
        {sortedSets.length > 0 && (
          <div className="schedule-sets bracket-set-scores">
            {sortedSets.map((set) => {
              const score = getDisplaySetScore(match, set);
              return (
                <span className="set-score-chip" key={set.set_number}>
                  {getSetLabel(match, set.set_number)}: {score.home_points}-{score.away_points}
                </span>
              );
            })}
          </div>
        )}
      </article>
    );
  };

  if (loading) {
    return (
      <>
        <RealtimeStatus status={realtimeStatus} />
        <div className="status-message">Cargando semifinales y final...</div>
      </>
    );
  }

  return (
    <>
      <RealtimeStatus status={realtimeStatus} />
      {error && <ReadError message={error} onRetry={() => void fetchBracket()} />}
      <section className="bracket-container" aria-label="Semifinales y final">
        <div className="bracket-heading">
          <span className="bracket-eyebrow">FASE ELIMINATORIA</span>
          <h2>Semifinales y gran final</h2>
          <p>Cuadro oficial actualizado con los resultados del torneo.</p>
        </div>
        <div className="bracket-semifinals">
          {renderRound("sf-1", "Semifinal 1")}
          {renderRound("sf-2", "Semifinal 2")}
        </div>
        <div className="bracket-final">
          {renderRound("final", "Gran final")}
        </div>
        {extraMatches.length > 0 && (
          <section className="bracket-extra">
            <h3>Otros partidos eliminatorios</h3>
            <div className="schedule-list">
              {extraMatches.map((match) => (
                <article className="bracket-card" key={match.id}>
                  <div className="bracket-card-header">
                    <span className="bracket-round-label">{match.id}</span>
                    <span className="status-pill sched">{match.status.toUpperCase()}</span>
                  </div>
                  <div className="bracket-team-row">{match.home?.name ?? "Por definir"}</div>
                  <div className="bracket-team-row">{match.away?.name ?? "Por definir"}</div>
                </article>
              ))}
            </div>
          </section>
        )}
      </section>
    </>
  );
}

