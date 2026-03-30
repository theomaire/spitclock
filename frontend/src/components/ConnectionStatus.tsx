import type { ConnectionStatus as ConnStatus } from "../types";

interface Props {
  status: ConnStatus;
  loading: boolean;
  onRefresh: () => void;
}

export default function ConnectionStatus({ status, loading, onRefresh }: Props) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "8px 16px",
        background: "#f0ede8",
        borderRadius: 8,
        fontSize: 13,
        border: "1px solid #e0dbd4",
      }}
    >
      <div
        style={{
          width: 10,
          height: 10,
          borderRadius: "50%",
          background: status.connected ? "#16a34a" : "#dc2626",
          boxShadow: status.connected
            ? "0 0 8px rgba(22,163,74,0.5)"
            : "0 0 8px rgba(220,38,38,0.4)",
        }}
      />
      <span style={{ color: "#555" }}>
        {loading
          ? "Connecting..."
          : status.connected
          ? `Pi connected via ${status.method} (${status.latency_ms}ms)`
          : "Pi disconnected"}
      </span>
      {status.connected && status.host && (
        <span style={{ color: "#999", fontSize: 11 }}>{status.host}</span>
      )}
      <button
        onClick={onRefresh}
        disabled={loading}
        style={{
          marginLeft: "auto",
          padding: "4px 10px",
          background: "#fff",
          color: "#555",
          border: "1px solid #d4cfc8",
          borderRadius: 4,
          cursor: "pointer",
          fontSize: 12,
        }}
      >
        {loading ? "..." : "Refresh"}
      </button>
    </div>
  );
}
