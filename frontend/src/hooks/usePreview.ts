import { useCallback, useEffect, useRef, useState } from "react";
import type { PreviewFrame } from "../types";
import { previewWsUrl } from "../api/client";

export function usePreview() {
  const [frame, setFrame] = useState<PreviewFrame | null>(null);
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const ws = new WebSocket(previewWsUrl());
    wsRef.current = ws;

    ws.onopen = () => setConnected(true);
    ws.onclose = () => {
      setConnected(false);
      reconnectTimer.current = setTimeout(connect, 1000);
    };
    ws.onmessage = (e) => {
      try {
        setFrame(JSON.parse(e.data));
      } catch {}
    };
  }, []);

  useEffect(() => {
    connect();
    return () => {
      clearTimeout(reconnectTimer.current);
      wsRef.current?.close();
    };
  }, [connect]);

  const selectProgram = useCallback((programId: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ program_id: programId }));
    }
  }, []);

  const reload = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ action: "reload" }));
    }
  }, []);

  return { frame, connected, selectProgram, reload };
}
