import type { RealtimeConnectionStatus } from "../lib/usePublicRealtime";

type RealtimeStatusProps = {
  status: RealtimeConnectionStatus;
};

export function RealtimeStatus({ status }: RealtimeStatusProps) {
  const label = {
    connecting: "Conectando actualizaciones...",
    active: "Actualizaciones en vivo activas",
    error: "Error de conexión en vivo",
  }[status];

  return <div className={`realtime-status ${status}`}>{label}</div>;
}

type ReadErrorProps = {
  message: string;
  onRetry: () => void;
};

export function ReadError({ message, onRetry }: ReadErrorProps) {
  return (
    <div className="error-card" role="alert">
      <h3>No se pudo cargar la información</h3>
      <p>{message}</p>
      <button className="retry-btn" onClick={onRetry} type="button">
        Reintentar
      </button>
    </div>
  );
}
