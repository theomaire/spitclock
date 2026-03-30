const BASE = import.meta.env.DEV ? "http://localhost:8421" : "";

async function api<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${res.status}: ${text}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

import type {
  ConnectionSettings,
  ConnectionStatus,
  DeployResult,
  Program,
  Schedule,
  ScheduleRule,
} from "../types";

// Programs
export const getPrograms = () => api<Record<string, Program>>("/api/programs/");
export const getProgram = (id: string) => api<Program>(`/api/programs/${id}`);
export const createProgram = (id: string, p: Program) =>
  api<Program>(`/api/programs/${id}`, { method: "POST", body: JSON.stringify(p) });
export const updateProgram = (id: string, p: Program) =>
  api<Program>(`/api/programs/${id}`, { method: "PUT", body: JSON.stringify(p) });
export const deleteProgram = (id: string) =>
  api<void>(`/api/programs/${id}`, { method: "DELETE" });

// Schedule
export const getSchedule = () => api<Schedule>("/api/schedule/");
export const updateSchedule = (s: Schedule) =>
  api<Schedule>("/api/schedule/", { method: "PUT", body: JSON.stringify(s) });
export const addScheduleRule = (r: ScheduleRule) =>
  api<Schedule>("/api/schedule/rules", { method: "POST", body: JSON.stringify(r) });
export const deleteScheduleRule = (index: number) =>
  api<void>(`/api/schedule/rules/${index}`, { method: "DELETE" });

// Connection
export const getConnectionStatus = () => api<ConnectionStatus>("/api/connection/status");
export const discoverPi = () => api<ConnectionStatus>("/api/connection/discover", { method: "POST" });
export const getConnectionSettings = () => api<ConnectionSettings>("/api/connection/settings");
export const updateConnectionSettings = (s: ConnectionSettings) =>
  api<ConnectionSettings>("/api/connection/settings", { method: "PUT", body: JSON.stringify(s) });

// Deploy
export const deployToPi = () => api<DeployResult>("/api/deploy/push", { method: "POST" });
export const getDeployStatus = () => api<Record<string, unknown>>("/api/deploy/status");
export const syncTime = () => api<Record<string, unknown>>("/api/deploy/sync-time", { method: "POST" });

// Preview WebSocket URL
export const previewWsUrl = () => {
  const base = import.meta.env.DEV ? "ws://localhost:8421" : `ws://${window.location.host}`;
  return `${base}/api/preview/ws`;
};
