import { useState } from "react";
import { deployToPi } from "../api/client";

interface Props {
  piConnected: boolean;
}

export default function DeployButton({ piConnected }: Props) {
  const [state, setState] = useState<"idle" | "deploying" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleDeploy = async () => {
    setState("deploying");
    setMessage("");
    try {
      const result = await deployToPi();
      setState(result.success ? "success" : "error");
      setMessage(result.message);
      if (result.success) {
        setTimeout(() => setState("idle"), 3000);
      }
    } catch (e: any) {
      setState("error");
      setMessage(e.message ?? "Deploy failed");
    }
  };

  const colors = {
    idle: { bg: "#2563eb", border: "#3b82f6" },
    deploying: { bg: "#ca8a04", border: "#eab308" },
    success: { bg: "#16a34a", border: "#4ade80" },
    error: { bg: "#dc2626", border: "#ef4444" },
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <button
        onClick={handleDeploy}
        disabled={!piConnected || state === "deploying"}
        style={{
          padding: "12px 24px",
          background: piConnected ? colors[state].bg : "#ccc",
          color: "#fff",
          border: `2px solid ${piConnected ? colors[state].border : "#bbb"}`,
          borderRadius: 8,
          cursor: piConnected && state !== "deploying" ? "pointer" : "not-allowed",
          fontSize: 15,
          fontWeight: 600,
          transition: "all 0.2s",
        }}
      >
        {state === "deploying"
          ? "Deploying..."
          : state === "success"
          ? "Deployed!"
          : state === "error"
          ? "Retry Deploy"
          : "Push to Clock"}
      </button>
      {message && (
        <span
          style={{
            fontSize: 12,
            color: state === "error" ? "#dc2626" : "#16a34a",
            textAlign: "center",
          }}
        >
          {message}
        </span>
      )}
    </div>
  );
}
