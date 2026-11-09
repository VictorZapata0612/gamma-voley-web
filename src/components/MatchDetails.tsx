import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
import { usePublicRealtime } from "../lib/usePublicRealtime";
import { getDisplaySetScore, getSetLabel } from "../lib/matchFormat";
import type {
  Match,
  MatchAlignmentState,
  MatchLineup,
  MatchSet,
  MatchTimeout,
  PlayerInfo,
  RotationEvent,
  RotationFault,
  ScoreEvent,
  SubstitutionEvent,
} from "../types";
import { ReadError } from "./RealtimeStatus";

type DetailData = {
  sets: MatchSet[];
  scoreEvents: ScoreEvent[];
  lineups: MatchLineup[];
  alignments: MatchAlignmentState[];
  rotations: RotationEvent[];
  faults: RotationFault[];
  substitutions: SubstitutionEvent[];
  timeouts: MatchTimeout[];
  players: PlayerInfo[];
};

const emptyDetails: DetailData = {
  sets: [],
  scoreEvents: [],
  lineups: [],
  alignments: [],
  rotations: [],
  faults: [],
  substitutions: [],
  timeouts: [],
  players: [],
};

const detailTables = [
  "match_sets",
  "score_events",
  "match_lineups",
  "set_alignment_state",
  "rotation_events",
  "rotation_faults",
  "substitution_events",
  "timeouts",
] as const;

function moment(value: string | null | undefined): string {
  if (!value) return "momento no disponible";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "momento no disponible"
    : date.toLocaleString("es-CO", { dateStyle: "short", timeStyle: "short" });
}

function teamName(match: Match, team: "home" | "away"): string {
  return team === "home" ? match.home?.name ?? "Local" : match.away?.name ?? "Visitante";
}

export function MatchDetails({ match }: { match: Match }) {
  const [details, setDetails] = useState<DetailData>(emptyDetails);
  const [missingTables, setMissingTables] = useState<string[]>([]);
  const [scoreEventsError, setScoreEventsError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDetails = useCallback(async () => {
    const results = await Promise.all(
      detailTables.map(async (table) => ({
        table,
        result: await supabase.from(table).select("*").eq("match_id", match.id),
      })),
    );

    const unavailable = results
      .filter(({ result }) => result.error)
      .map(({ table }) => table);
    setMissingTables(unavailable);
    setScoreEventsError(
      results.find(({ table }) => table === "score_events")?.result.error?.message ?? null,
    );
    const firstError = results.find(({ result }) => result.error)?.result.error;
    if (firstError && unavailable.length === detailTables.length) {
      setError(`No se pudieron leer los datos ampliados del partido: ${firstError.message}`);
      setLoading(false);
      return;
    }

    const rows = <T,>(table: (typeof detailTables)[number]): T[] =>
      (results.find((entry) => entry.table === table)?.result.data ?? []) as T[];
    const lineups = rows<MatchLineup>("match_lineups");
    const alignments = rows<MatchAlignmentState>("set_alignment_state");
    const faults = rows<RotationFault>("rotation_faults");
    const substitutions = rows<SubstitutionEvent>("substitution_events");
    const playerIds = new Set([
      ...lineups.map((row) => row.player_id),
      ...alignments.map((row) => row.server_player_id),
      ...faults.flatMap((row) => (row.incorrect_server_player_id ? [row.incorrect_server_player_id] : [])),
      ...substitutions.flatMap((row) => [row.player_out_id, row.player_in_id]),
    ]);

    let players: PlayerInfo[] = [];
    if (playerIds.size > 0) {
      const playerResult = await supabase
        .from("players")
        .select("id, name, jersey_number")
        .in("id", [...playerIds]);
      if (playerResult.error) {
        setMissingTables((current) => [...current, "players"]);
      } else {
        players = (playerResult.data ?? []) as PlayerInfo[];
      }
    }

    setDetails({
      sets: rows<MatchSet>("match_sets").sort((a, b) => a.set_number - b.set_number),
      scoreEvents: rows<ScoreEvent>("score_events").sort(
        (a, b) => a.created_at.localeCompare(b.created_at) || a.id.localeCompare(b.id),
      ),
      lineups: lineups
        .filter((row) => row.set_number === match.current_set)
        .sort((a, b) => a.team.localeCompare(b.team) || a.position - b.position),
      alignments: alignments.filter((row) => row.set_number === match.current_set),
      rotations: rows<RotationEvent>("rotation_events").sort((a, b) => b.created_at.localeCompare(a.created_at)),
      faults: faults.sort((a, b) => b.created_at.localeCompare(a.created_at)),
      substitutions: substitutions.sort((a, b) => b.created_at.localeCompare(a.created_at)),
      timeouts: rows<MatchTimeout>("timeouts").sort((a, b) => b.used_at.localeCompare(a.used_at)),
      players,
    });
    setError(null);
    setLoading(false);
  }, [match.id]);

  const subscriptions = useMemo(
    () => detailTables.map((table) => ({ table, filter: `match_id=eq.${match.id}` })),
    [match.id],
  );
  usePublicRealtime({
    channelName: `public-match-details-${match.id}`,
    subscriptions,
    onRefresh: fetchDetails,
  });

  useEffect(() => {
    void fetchDetails();
  }, [fetchDetails]);

  const playerName = (id: string) => {
    const player = details.players.find((entry) => entry.id === id);
    return player ? `${player.name}${player.jersey_number === null ? "" : ` (#${player.jersey_number})`}` : id;
  };
  const hasAlignment = details.lineups.length > 0 || details.alignments.length > 0;
  const servingTeam = details.alignments.find((entry) => entry.is_serving === 1)?.team;
  const scoreHistory = useMemo(() => {
    const historyBySet = new Map<number, Array<ScoreEvent & { home_points: number; away_points: number }>>();
    const runningScores = new Map<number, { home_points: number; away_points: number }>();

    for (const event of details.scoreEvents) {
      const current = runningScores.get(event.set_number) ?? { home_points: 0, away_points: 0 };
      const next = {
        home_points: current.home_points + (event.team === "home" ? event.delta : 0),
        away_points: current.away_points + (event.team === "away" ? event.delta : 0),
      };
      runningScores.set(event.set_number, next);
      const setHistory = historyBySet.get(event.set_number) ?? [];
      setHistory.push({ ...event, ...next });
      historyBySet.set(event.set_number, setHistory);
    }

    return [...historyBySet.entries()]
      .sort(([setA], [setB]) => setB - setA)
      .map(([setNumber, events]) => ({ setNumber, events: [...events].reverse() }));
  }, [details.scoreEvents]);
  const scoreHistoryWarnings = scoreHistory.filter(({ setNumber, events }) => {
    const officialSet = details.sets.find((set) => set.set_number === setNumber);
    const lastEvent = events[0];
    return officialSet && lastEvent && (
      officialSet.home_points !== lastEvent.home_points ||
      officialSet.away_points !== lastEvent.away_points
    );
  });

  if (loading) return <div className="match-details"><p>Cargando datos ampliados...</p></div>;
  if (error) return <div className="match-details"><ReadError message={error} onRetry={() => void fetchDetails()} /></div>;

  return (
    <div className="match-details">
      {missingTables.length > 0 && (
        <p className="details-notice">
          El esquema remoto no expone: {missingTables.join(", ")}. Esos datos no se muestran.
        </p>
      )}
      <section>
        <h4>Marcador y sets</h4>
        {(() => {
          const current = details.sets.find((set) => set.set_number === match.current_set);
          const displayedCurrentScore = current ? getDisplaySetScore(match, current) : null;
          return (
            <p className="current-detail-score">
              Marcador actual ({getSetLabel(match, match.current_set)}): {displayedCurrentScore?.home_points ?? 0} - {displayedCurrentScore?.away_points ?? 0}
            </p>
          );
        })()}
        <div className="detail-set-list">
          {details.sets.length === 0 ? <span>Resultados por set no disponibles.</span> : details.sets.map((set) => {
            const displayedScore = getDisplaySetScore(match, set);
            return (
              <span key={set.set_number} className={set.set_number === match.current_set ? "detail-set active" : "detail-set"}>
                {getSetLabel(match, set.set_number)}: {displayedScore.home_points} - {displayedScore.away_points}
              </span>
            );
          })}
        </div>
      </section>

      <section>
        <h4>Historial de puntos</h4>
        {scoreEventsError ? (
          <ReadError
            message={`No se pudo cargar el historial de puntos: ${scoreEventsError}`}
            onRetry={() => void fetchDetails()}
          />
        ) : details.scoreEvents.length === 0 ? (
          <p className="table-empty">No hay eventos de puntos registrados para este partido.</p>
        ) : (
          <>
            {scoreHistoryWarnings.length > 0 && (
              <p className="details-notice">
                El historial de eventos no coincide con el marcador oficial de {scoreHistoryWarnings.map(({ setNumber }) => getSetLabel(match, setNumber)).join(", ")}. Se muestran los acumulados derivados de los eventos disponibles.
              </p>
            )}
            <div className="score-history">
              {scoreHistory.map(({ setNumber, events }) => (
                <section className="score-history-set" key={setNumber}>
                  <h5>{getSetLabel(match, setNumber)}</h5>
                  <ol className="score-history-list">
                    {events.map((event) => (
                      <li key={event.id} className="score-history-item">
                        <span>
                          {event.delta === 1
                            ? `${teamName(match, event.team)} anotó`
                            : `Ajuste: se restó a ${teamName(match, event.team)}`}
                          {event.reason ? ` · ${event.reason}` : ""}
                        </span>
                        <strong>{event.home_points} - {event.away_points}</strong>
                        <time dateTime={event.created_at}>{moment(event.created_at)}</time>
                      </li>
                    ))}
                  </ol>
                </section>
              ))}
            </div>
          </>
        )}
      </section>

      {hasAlignment && <section>
        <h4>Servicio y posiciones actuales</h4>
        {
          <div className="alignment-grid">
            {(["home", "away"] as const).map((team) => {
              const state = details.alignments.find((entry) => entry.team === team);
              const lineup = details.lineups.filter((entry) => entry.team === team);
              return (
                <div key={team} className="alignment-team">
                  <strong>{teamName(match, team)}</strong>
                  <span>{servingTeam === team ? "Saca este equipo" : "No saca"}</span>
                  {state && <span>Servidor: {playerName(state.server_player_id)} · posición {state.server_position}</span>}
                  <ol>
                    {lineup.map((entry) => (
                      <li key={`${entry.team}-${entry.position}`}>
                        P{entry.current_position}: {playerName(entry.player_id)}
                      </li>
                    ))}
                  </ol>
                  {lineup.length > 0 && lineup.length < 6 && <small>Solo hay {lineup.length} jugadores registrados.</small>}
                </div>
              );
            })}
          </div>
        }
      </section>}

      {(details.rotations.length > 0 || details.timeouts.length > 0 || details.faults.length > 0 || details.substitutions.length > 0) && <section>
        <h4>Actividad del partido</h4>
        <ul className="detail-events">
            {details.rotations.map((event) => <li key={`rotation-${event.id}`}>Rotación de {teamName(match, event.team)} · {getSetLabel(match, event.set_number)} · {moment(event.created_at)}</li>)}
            {details.timeouts.map((timeout) => <li key={`timeout-${timeout.team}-${timeout.set_number}`}>Tiempo muerto de {teamName(match, timeout.team)} · {getSetLabel(match, timeout.set_number)} · {moment(timeout.used_at)}</li>)}
            {details.substitutions.map((event) => <li key={`substitution-${event.id}`}>Cambio de {teamName(match, event.team)}: {playerName(event.player_out_id)} por {playerName(event.player_in_id)} · {getSetLabel(match, event.set_number)} · {moment(event.occurred_at)}</li>)}
            {details.faults.map((fault) => <li key={`fault-${fault.id}`}>Falta de rotación de {teamName(match, fault.team)}: {fault.sanction} ({fault.reason}) · {getSetLabel(match, fault.set_number)} · {moment(fault.occurred_at ?? fault.created_at)}</li>)}
        </ul>
      </section>}
    </div>
  );
}
