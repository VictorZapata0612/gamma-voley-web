import { useState } from "react";
import { LiveScoreboard } from "./components/LiveScoreboard";
import { StandingsTable } from "./components/StandingsTable";
import { ScheduleList } from "./components/ScheduleList";
import "./App.css";

export default function App() {
  const [tab, setTab] = useState<"live" | "standings" | "schedule">("live");
  const [shareMessage, setShareMessage] = useState<string | null>(null);

  const shareTournament = async () => {
    const shareData = {
      title: "Torneo Mixto 2026 | Gamma Voley",
      text: "Sigue los resultados, el calendario y las posiciones del torneo.",
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        setShareMessage("Enlace compartido");
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
        setShareMessage("No se pudo compartir el enlace");
      }
      return;
    }

    try {
      await navigator.clipboard.writeText(shareData.url);
      setShareMessage("Enlace copiado");
    } catch {
      setShareMessage("Copia el enlace desde la barra del navegador");
    }
  };

  return (
    <div className="app-container">
      <header className="main-header">
        <div className="header-topline">
          <div className="brand-badge">🏐 GAMMA VOLEY</div>
          <button className="share-btn" onClick={() => void shareTournament()} type="button">
            ↗ Compartir
          </button>
        </div>
        <h1>Torneo Mixto 2026</h1>
        <p className="sub-title">Resultados, calendario y posiciones en vivo</p>
        {shareMessage && <p className="share-message" role="status">{shareMessage}</p>}
      </header>

      <nav className="tab-bar">
        <button
          className={`tab-btn ${tab === "live" ? "active" : ""}`}
          onClick={() => setTab("live")}
        >
          🔴 En Vivo
        </button>
        <button
          className={`tab-btn ${tab === "standings" ? "active" : ""}`}
          onClick={() => setTab("standings")}
        >
          🏆 Posiciones
        </button>
        <button
          className={`tab-btn ${tab === "schedule" ? "active" : ""}`}
          onClick={() => setTab("schedule")}
        >
          📅 Calendario
        </button>
      </nav>

      <main className="content-area" aria-live="polite">
        {tab === "live" && <LiveScoreboard />}
        {tab === "standings" && <StandingsTable />}
        {tab === "schedule" && <ScheduleList />}
      </main>

      <footer className="main-footer">
        Gamma Voley Club · Actualización en tiempo real vía Supabase
      </footer>
    </div>
  );
}