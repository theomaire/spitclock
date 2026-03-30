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
        background: "#1a1a1a",
        borderRadius: 8,
        fontSize: 13,
      }}
    >
      <div
        style={{
          width: 10,
          height: 10,
          borderRadius: "50%",
          background: status.connected ? "#4ade80" : "#ef4444",
          boxShadow: status.connected
            ? "0 0 8px #4ade80"
            : "0 0 8px #ef4444",
        }}
      />
      <span style={{ color: "#ccc" }}>
        {loading
          ? "Connecting..."
          : status.connected
          ? `Pi connected via ${status.method} (${status.latency_ms}ms)`
          : "Pi disconnected"}
      </span>
      {status.connected && status.host && (
        <span style={{ color: "#666", fontSize: 11 }}>{status.host}</span>
      )}
      <button
        onClick={onRefresh}
        disabled={loading}
        style={{
          marginLeft: "auto",
          padding: "4px 10px",
          background: "#333",
          color: "#ccc",
          border: "1px solid #444",
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
