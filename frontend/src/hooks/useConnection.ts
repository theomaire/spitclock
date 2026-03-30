import { useCallback, useEffect, useState } from "react";
import type { ConnectionStatus } from "../types";
import { discoverPi } from "../api/client";

export function useConnection() {
  const [status, setStatus] = useState<ConnectionStatus>({
    connected: false,
    method: null,
    host: null,
    latency_ms: null,
  });
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const s = await discoverPi();
      setStatus(s);
    } catch {
      setStatus({ connected: false, method: null, host: null, latency_ms: null });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { status, loading, refresh };
}
