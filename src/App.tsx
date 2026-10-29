import { useState } from "react";
import { LiveScoreboard } from "./components/LiveScoreboard";
import { StandingsTable } from "./components/StandingsTable";
import { ScheduleList } from "./components/ScheduleList";
import "./App.css";

export default function App() {
  const [tab, setTab] = useState<"live" | "standings" | "schedule">("live");

  return (
    <div className="app-container">
      <header className="main-header">
        <div className="brand-badge">🏐 GAMMA VOLEY</div>
        <h1>Torneo Mixto 2026</h1>
        <p className="sub-title">Resultados y Marcadores en Vivo</p>
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

      <main className="content-area">
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