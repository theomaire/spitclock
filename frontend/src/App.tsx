import { useCallback, useEffect, useState } from "react";
import type { Program, Schedule } from "./types";
import {
  createProgram,
  deleteProgram,
  getPrograms,
  getSchedule,
  updateProgram,
  updateSchedule,
} from "./api/client";
import { usePreview } from "./hooks/usePreview";
import { useConnection } from "./hooks/useConnection";
import LEDRingPreview from "./components/LEDRingPreview";
import ProgramEditor from "./components/ProgramEditor";
import ScheduleTimeline from "./components/ScheduleTimeline";
import ConnectionStatus from "./components/ConnectionStatus";
import DeployButton from "./components/DeployButton";

type Tab = "programs" | "schedule";

export default function App() {
  const [programs, setPrograms] = useState<Record<string, Program>>({});
  const [schedule, setSchedule] = useState<Schedule>({ default_program: "clock_default", rules: [], chimes: [] });
  const [selectedProgramId, setSelectedProgramId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("programs");

  const { frame, connected: wsConnected, selectProgram, reload } = usePreview();
  const { status: piStatus, loading: piLoading, refresh: piRefresh } = useConnection();

  const loadData = useCallback(async () => {
    try {
      const [progs, sched] = await Promise.all([getPrograms(), getSchedule()]);
      setPrograms(progs);
      setSchedule(sched);
      if (!selectedProgramId && Object.keys(progs).length > 0) {
        const first = Object.keys(progs)[0];
        setSelectedProgramId(first);
        selectProgram(first);
      }
    } catch (e) {
      console.error("Failed to load data:", e);
    }
  }, [selectedProgramId, selectProgram]);

  useEffect(() => {
    loadData();
  }, []);

  const handleSelectProgram = (id: string) => {
    setSelectedProgramId(id);
    selectProgram(id);
  };

  const handleSaveProgram = async (id: string, program: Program) => {
    try {
      await updateProgram(id, program);
      setPrograms((prev) => ({ ...prev, [id]: program }));
      reload();
    } catch (e: any) {
      alert(`Save failed: ${e.message}`);
    }
  };

  const handleCreateProgram = async (id: string, program: Program) => {
    try {
      await createProgram(id, program);
      setPrograms((prev) => ({ ...prev, [id]: program }));
      setSelectedProgramId(id);
      selectProgram(id);
    } catch (e: any) {
      alert(`Create failed: ${e.message}`);
    }
  };

  const handleDeleteProgram = async (id: string) => {
    try {
      await deleteProgram(id);
      setPrograms((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      if (selectedProgramId === id) {
        const remaining = Object.keys(programs).filter((k) => k !== id);
        const next = remaining[0] ?? null;
        setSelectedProgramId(next);
        if (next) selectProgram(next);
      }
    } catch (e: any) {
      alert(`Delete failed: ${e.message}`);
    }
  };

  const handleUpdateSchedule = async (sched: Schedule) => {
    try {
      const updated = await updateSchedule(sched);
      setSchedule(updated);
    } catch (e: any) {
      alert(`Schedule update failed: ${e.message}`);
    }
  };

  const tabStyle = (tab: Tab) => ({
    padding: "8px 20px",
    background: activeTab === tab ? "#2563eb" : "transparent",
    color: activeTab === tab ? "#fff" : "#888",
    border: "none",
    borderBottom: activeTab === tab ? "2px solid #2563eb" : "2px solid transparent",
    borderRadius: activeTab === tab ? "6px 6px 0 0" : 0,
    cursor: "pointer" as const,
    fontSize: 14,
    fontWeight: 500 as const,
  });

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#faf8f5",
        color: "#2a2a2a",
        fontFamily: "'Inter', -apple-system, sans-serif",
      }}
    >
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 24px",
          background: "#fff",
          borderBottom: "1px solid #e5e2dc",
          boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, letterSpacing: -0.5 }}>
            SpitOclock
          </h1>
          <span style={{ color: "#999", fontSize: 12 }}>LED Clock Programmer</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <ConnectionStatus status={piStatus} loading={piLoading} onRefresh={piRefresh} />
          <DeployButton piConnected={piStatus.connected} />
        </div>
      </header>

      <div
        style={{
          display: "flex",
          padding: 24,
          gap: 24,
          maxWidth: 1400,
          margin: "0 auto",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 16, alignItems: "center" }}>
          <LEDRingPreview frame={frame} />
          <div style={{ fontSize: 12, color: "#999", textAlign: "center" }}>
            {wsConnected ? "Live preview" : "Connecting to preview..."}
            {selectedProgramId && (
              <> &middot; <span style={{ color: "#2563eb" }}>{programs[selectedProgramId]?.name}</span></>
            )}
          </div>
        </div>

        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 0 }}>
          <div style={{ display: "flex", borderBottom: "1px solid #e5e2dc", marginBottom: 16 }}>
            <button style={tabStyle("programs")} onClick={() => setActiveTab("programs")}>
              Programs
            </button>
            <button style={tabStyle("schedule")} onClick={() => setActiveTab("schedule")}>
              Schedule
            </button>
          </div>

          {activeTab === "programs" ? (
            <ProgramEditor
              programs={programs}
              selectedId={selectedProgramId}
              onSelect={handleSelectProgram}
              onSave={handleSaveProgram}
              onDelete={handleDeleteProgram}
              onCreate={handleCreateProgram}
            />
          ) : (
            <ScheduleTimeline
              schedule={schedule}
              programs={programs}
              onUpdate={handleUpdateSchedule}
            />
          )}
        </div>
      </div>
    </div>
  );
}
