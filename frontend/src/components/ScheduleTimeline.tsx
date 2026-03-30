import { useState } from "react";
import type { Program, Schedule, ScheduleRule } from "../types";

interface Props {
  schedule: Schedule;
  programs: Record<string, Program>;
  onUpdate: (schedule: Schedule) => void;
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

function timeToPercent(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return ((h * 60 + m) / 1440) * 100;
}

const RULE_COLORS = [
  "#2563eb", "#9333ea", "#ea580c", "#16a34a", "#ca8a04", "#db2777",
  "#0891b2", "#4f46e5", "#c2410c", "#059669",
];

export default function ScheduleTimeline({ schedule, programs, onUpdate }: Props) {
  const [addStart, setAddStart] = useState("22:00");
  const [addEnd, setAddEnd] = useState("07:00");
  const [addProgram, setAddProgram] = useState("");
  const [addDays, setAddDays] = useState<string[]>([]);

  const programIds = Object.keys(programs);

  const handleAddRule = () => {
    if (!addProgram) return;
    const rule: ScheduleRule = {
      start: addStart,
      end: addEnd,
      program: addProgram,
      days: addDays.length > 0 ? addDays : null,
    };
    onUpdate({ ...schedule, rules: [...schedule.rules, rule] });
  };

  const handleDeleteRule = (idx: number) => {
    const rules = schedule.rules.filter((_, i) => i !== idx);
    onUpdate({ ...schedule, rules });
  };

  const handleSetDefault = (programId: string) => {
    onUpdate({ ...schedule, default_program: programId });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {/* Timeline visualization */}
      <div style={{ background: "#fff", borderRadius: 8, border: "1px solid #e5e2dc", padding: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: "#2a2a2a", marginBottom: 12 }}>24-Hour Timeline</div>

        {/* Default program bar */}
        <div style={{ position: "relative", height: 32, background: "#e8e4de", borderRadius: 4, marginBottom: 4, overflow: "hidden" }}>
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "#ddd8d0",
              display: "flex",
              alignItems: "center",
              paddingLeft: 8,
              fontSize: 11,
              color: "#888",
            }}
          >
            Default: {programs[schedule.default_program]?.name ?? schedule.default_program}
          </div>

          {/* Rule overlays */}
          {schedule.rules.map((rule, i) => {
            const startPct = timeToPercent(rule.start);
            const endPct = timeToPercent(rule.end);
            const color = RULE_COLORS[i % RULE_COLORS.length];

            if (endPct > startPct) {
              // Same-day range
              return (
                <div
                  key={i}
                  style={{
                    position: "absolute",
                    left: `${startPct}%`,
                    width: `${endPct - startPct}%`,
                    top: 0,
                    bottom: 0,
                    background: color,
                    opacity: 0.8,
                    display: "flex",
                    alignItems: "center",
                    paddingLeft: 4,
                    fontSize: 10,
                    color: "#fff",
                    overflow: "hidden",
                    whiteSpace: "nowrap",
                    borderRadius: 2,
                  }}
                  title={`${rule.start}-${rule.end}: ${programs[rule.program]?.name ?? rule.program}`}
                >
                  {programs[rule.program]?.name ?? rule.program}
                </div>
              );
            } else {
              // Overnight range (wraps around midnight)
              return (
                <div key={i}>
                  <div
                    style={{
                      position: "absolute",
                      left: `${startPct}%`,
                      width: `${100 - startPct}%`,
                      top: 0,
                      bottom: 0,
                      background: color,
                      opacity: 0.8,
                      display: "flex",
                      alignItems: "center",
                      paddingLeft: 4,
                      fontSize: 10,
                      color: "#fff",
                      overflow: "hidden",
                      whiteSpace: "nowrap",
                      borderRadius: "2px 0 0 2px",
                    }}
                    title={`${rule.start}-${rule.end}: ${programs[rule.program]?.name ?? rule.program}`}
                  >
                    {programs[rule.program]?.name ?? rule.program}
                  </div>
                  <div
                    style={{
                      position: "absolute",
                      left: 0,
                      width: `${endPct}%`,
                      top: 0,
                      bottom: 0,
                      background: color,
                      opacity: 0.8,
                      borderRadius: "0 2px 2px 0",
                    }}
                  />
                </div>
              );
            }
          })}
        </div>

        {/* Hour markers */}
        <div style={{ position: "relative", height: 16, marginTop: 2 }}>
          {HOURS.filter((h) => h % 3 === 0).map((h) => (
            <span
              key={h}
              style={{
                position: "absolute",
                left: `${(h / 24) * 100}%`,
                transform: "translateX(-50%)",
                fontSize: 10,
                color: "#555",
                fontFamily: "monospace",
              }}
            >
              {h.toString().padStart(2, "0")}
            </span>
          ))}
        </div>
      </div>

      {/* Default program selector */}
      <div style={{ background: "#fff", borderRadius: 8, border: "1px solid #e5e2dc", padding: 12, display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ color: "#777", fontSize: 13, minWidth: 120 }}>Default program</span>
        <select
          value={schedule.default_program}
          onChange={(e) => handleSetDefault(e.target.value)}
          style={{ flex: 1, padding: "6px 8px", background: "#fff", color: "#2a2a2a", border: "1px solid #d4cfc8", borderRadius: 4, fontSize: 13 }}
        >
          {programIds.map((id) => (
            <option key={id} value={id}>
              {programs[id].name} ({id})
            </option>
          ))}
        </select>
      </div>

      {/* Rules list */}
      <div style={{ background: "#fff", borderRadius: 8, border: "1px solid #e5e2dc", padding: 12 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: "#2a2a2a", marginBottom: 8 }}>Schedule Rules</div>
        {schedule.rules.length === 0 && (
          <div style={{ color: "#666", fontSize: 13, fontStyle: "italic" }}>No rules — default program runs 24/7</div>
        )}
        {schedule.rules.map((rule, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 0",
              borderBottom: "1px solid #e5e2dc",
              fontSize: 13,
            }}
          >
            <div
              style={{
                width: 12,
                height: 12,
                borderRadius: 2,
                background: RULE_COLORS[i % RULE_COLORS.length],
                flexShrink: 0,
              }}
            />
            <span style={{ color: "#2a2a2a", fontFamily: "monospace" }}>
              {rule.start}–{rule.end}
            </span>
            <span style={{ color: "#2563eb" }}>{programs[rule.program]?.name ?? rule.program}</span>
            {rule.days && (
              <span style={{ color: "#666", fontSize: 11 }}>
                {rule.days.map((d) => d.slice(0, 3)).join(", ")}
              </span>
            )}
            <button
              onClick={() => handleDeleteRule(i)}
              style={{
                marginLeft: "auto",
                background: "none",
                border: "none",
                color: "#666",
                cursor: "pointer",
                fontSize: 16,
              }}
            >
              x
            </button>
          </div>
        ))}
      </div>

      {/* Add rule */}
      <div style={{ background: "#fff", borderRadius: 8, border: "1px solid #e5e2dc", padding: 12, display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: "#2a2a2a" }}>Add Rule</div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input
            type="time"
            value={addStart}
            onChange={(e) => setAddStart(e.target.value)}
            style={{ padding: "4px 8px", background: "#fff", color: "#2a2a2a", border: "1px solid #d4cfc8", borderRadius: 4 }}
          />
          <span style={{ color: "#666" }}>to</span>
          <input
            type="time"
            value={addEnd}
            onChange={(e) => setAddEnd(e.target.value)}
            style={{ padding: "4px 8px", background: "#fff", color: "#2a2a2a", border: "1px solid #d4cfc8", borderRadius: 4 }}
          />
          <select
            value={addProgram}
            onChange={(e) => setAddProgram(e.target.value)}
            style={{ flex: 1, padding: "6px 8px", background: "#fff", color: "#2a2a2a", border: "1px solid #d4cfc8", borderRadius: 4, fontSize: 13 }}
          >
            <option value="">Select program...</option>
            {programIds.map((id) => (
              <option key={id} value={id}>
                {programs[id].name}
              </option>
            ))}
          </select>
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {DAYS.map((day) => (
            <label key={day} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "#666" }}>
              <input
                type="checkbox"
                checked={addDays.includes(day)}
                onChange={(e) =>
                  setAddDays(e.target.checked ? [...addDays, day] : addDays.filter((d) => d !== day))
                }
              />
              {day.slice(0, 3)}
            </label>
          ))}
          <span style={{ color: "#666", fontSize: 11, alignSelf: "center" }}>(empty = all days)</span>
        </div>
        <button
          onClick={handleAddRule}
          disabled={!addProgram}
          style={{
            padding: "8px",
            background: addProgram ? "#16a34a" : "#ccc",
            color: "#fff",
            border: "none",
            borderRadius: 4,
            cursor: addProgram ? "pointer" : "not-allowed",
            fontSize: 13,
          }}
        >
          Add Rule
        </button>
      </div>
    </div>
  );
}
