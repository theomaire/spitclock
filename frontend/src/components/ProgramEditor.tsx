import { useEffect, useState } from "react";
import type { Color, EffectType, IllumStripMode, Program, ProgramType } from "../types";

interface Props {
  programs: Record<string, Program>;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onSave: (id: string, program: Program) => void;
  onDelete: (id: string) => void;
  onCreate: (id: string, program: Program) => void;
}

const PROGRAM_TYPES: ProgramType[] = ["clock", "solid", "effect", "custom"];
const EFFECT_TYPES: EffectType[] = ["rainbow_cycle", "breathing", "chase", "sparkle", "fire"];
const ILLUM_MODES: IllumStripMode[] = ["off", "solid", "rainbow_cycle", "breathing", "chase"];

const PRESET_PROGRAMS: Record<string, Program> = {
  clock: {
    type: "clock",
    name: "New Clock",
    clock_ring: { brightness: 1.0, hour_color: [150, 0, 0], minute_color: [0, 150, 0], second_color: [0, 50, 150], bg_color: [0, 0, 0] },
    illum_strip: { brightness: 0, color: [255, 0, 0], mode: "off", speed: 0.05 },
    effect: null,
    effect_speed: 0.05,
    custom_ring_colors: null,
    custom_illum_colors: null,
  },
  solid: {
    type: "solid",
    name: "New Solid",
    clock_ring: { brightness: 0.8, hour_color: [150, 0, 0], minute_color: [0, 150, 0], second_color: [0, 50, 150], bg_color: [255, 150, 50] },
    illum_strip: { brightness: 100, color: [255, 150, 50], mode: "solid", speed: 0.05 },
    effect: null,
    effect_speed: 0.05,
    custom_ring_colors: null,
    custom_illum_colors: null,
  },
  effect: {
    type: "effect",
    name: "New Effect",
    clock_ring: { brightness: 1.0, hour_color: [150, 0, 0], minute_color: [0, 150, 0], second_color: [0, 50, 150], bg_color: [150, 0, 150] },
    illum_strip: { brightness: 128, color: [255, 0, 0], mode: "rainbow_cycle", speed: 0.03 },
    effect: "rainbow_cycle",
    effect_speed: 0.03,
    custom_ring_colors: null,
    custom_illum_colors: null,
  },
};

function colorToHex(c: Color): string {
  return "#" + c.map((v) => v.toString(16).padStart(2, "0")).join("");
}

function hexToColor(hex: string): Color {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return [r, g, b];
}

function ColorInput({ label, value, onChange }: { label: string; value: Color; onChange: (c: Color) => void }) {
  return (
    <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
      <span style={{ color: "#aaa", minWidth: 80 }}>{label}</span>
      <input
        type="color"
        value={colorToHex(value)}
        onChange={(e) => onChange(hexToColor(e.target.value))}
        style={{ width: 36, height: 28, border: "none", background: "none", cursor: "pointer" }}
      />
      <span style={{ color: "#666", fontSize: 11, fontFamily: "monospace" }}>
        {value[0]},{value[1]},{value[2]}
      </span>
    </label>
  );
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}) {
  return (
    <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
      <span style={{ color: "#aaa", minWidth: 80 }}>{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        style={{ flex: 1 }}
      />
      <span style={{ color: "#666", fontSize: 11, fontFamily: "monospace", minWidth: 40 }}>
        {value.toFixed(step < 1 ? 2 : 0)}
      </span>
    </label>
  );
}

function Select<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: T[];
  onChange: (v: T) => void;
}) {
  return (
    <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
      <span style={{ color: "#aaa", minWidth: 80 }}>{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        style={{
          flex: 1,
          padding: "4px 8px",
          background: "#222",
          color: "#ccc",
          border: "1px solid #444",
          borderRadius: 4,
        }}
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o.replace(/_/g, " ")}
          </option>
        ))}
      </select>
    </label>
  );
}

export default function ProgramEditor({ programs, selectedId, onSelect, onSave, onDelete, onCreate }: Props) {
  const [draft, setDraft] = useState<Program | null>(null);
  const [newId, setNewId] = useState("");

  useEffect(() => {
    if (selectedId && programs[selectedId]) {
      setDraft(structuredClone(programs[selectedId]));
    }
  }, [selectedId, programs]);

  const updateRing = (key: string, value: any) => {
    if (!draft) return;
    setDraft({ ...draft, clock_ring: { ...draft.clock_ring, [key]: value } });
  };

  const updateIllum = (key: string, value: any) => {
    if (!draft) return;
    setDraft({ ...draft, illum_strip: { ...draft.illum_strip, [key]: value } });
  };

  const handleCreate = () => {
    const id = newId.trim().replace(/\s+/g, "_").toLowerCase();
    if (!id || programs[id]) return;
    const preset = PRESET_PROGRAMS["clock"];
    const program = { ...preset, name: newId.trim() || id };
    onCreate(id, program);
    setNewId("");
  };

  const sectionStyle = {
    padding: "12px",
    background: "#1a1a1a",
    borderRadius: 8,
    display: "flex" as const,
    flexDirection: "column" as const,
    gap: 8,
  };

  const programIds = Object.keys(programs);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, minWidth: 320 }}>
      {/* Program list */}
      <div style={sectionStyle}>
        <div style={{ fontSize: 14, fontWeight: 600, color: "#eee", marginBottom: 4 }}>Programs</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {programIds.map((id) => (
            <button
              key={id}
              onClick={() => onSelect(id)}
              style={{
                padding: "8px 12px",
                background: id === selectedId ? "#2563eb" : "#222",
                color: id === selectedId ? "#fff" : "#ccc",
                border: id === selectedId ? "1px solid #3b82f6" : "1px solid #333",
                borderRadius: 6,
                cursor: "pointer",
                textAlign: "left",
                fontSize: 13,
              }}
            >
              <div style={{ fontWeight: 500 }}>{programs[id].name}</div>
              <div style={{ fontSize: 11, color: id === selectedId ? "#93c5fd" : "#666", marginTop: 2 }}>
                {programs[id].type} &middot; {id}
              </div>
            </button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
          <input
            placeholder="New program ID..."
            value={newId}
            onChange={(e) => setNewId(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            style={{
              flex: 1,
              padding: "6px 10px",
              background: "#222",
              color: "#ccc",
              border: "1px solid #444",
              borderRadius: 4,
              fontSize: 12,
            }}
          />
          <button
            onClick={handleCreate}
            style={{
              padding: "6px 12px",
              background: "#16a34a",
              color: "#fff",
              border: "none",
              borderRadius: 4,
              cursor: "pointer",
              fontSize: 12,
            }}
          >
            + New
          </button>
        </div>
      </div>

      {/* Editor */}
      {draft && selectedId && (
        <>
          <div style={sectionStyle}>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#eee" }}>General</div>
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
              <span style={{ color: "#aaa", minWidth: 80 }}>Name</span>
              <input
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                style={{
                  flex: 1,
                  padding: "4px 8px",
                  background: "#222",
                  color: "#ccc",
                  border: "1px solid #444",
                  borderRadius: 4,
                }}
              />
            </label>
            <Select label="Type" value={draft.type} options={PROGRAM_TYPES} onChange={(v) => setDraft({ ...draft, type: v })} />
          </div>

          {/* Clock ring settings */}
          <div style={sectionStyle}>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#eee" }}>Clock Ring (outer, 36 LEDs)</div>
            <Slider label="Brightness" value={draft.clock_ring.brightness} min={0} max={1} step={0.05} onChange={(v) => updateRing("brightness", v)} />
            {draft.type === "clock" && (
              <>
                <ColorInput label="Hour" value={draft.clock_ring.hour_color} onChange={(c) => updateRing("hour_color", c)} />
                <ColorInput label="Minute" value={draft.clock_ring.minute_color} onChange={(c) => updateRing("minute_color", c)} />
                <ColorInput label="Second" value={draft.clock_ring.second_color} onChange={(c) => updateRing("second_color", c)} />
              </>
            )}
            <ColorInput label="Background" value={draft.clock_ring.bg_color} onChange={(c) => updateRing("bg_color", c)} />
            {draft.type === "effect" && (
              <>
                <Select label="Effect" value={draft.effect ?? "rainbow_cycle"} options={EFFECT_TYPES} onChange={(v) => setDraft({ ...draft, effect: v })} />
                <Slider label="Speed" value={draft.effect_speed} min={0.005} max={0.5} step={0.005} onChange={(v) => setDraft({ ...draft, effect_speed: v })} />
              </>
            )}
          </div>

          {/* Illumination strip */}
          <div style={sectionStyle}>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#eee" }}>Illum Strip (inner, 15 LEDs)</div>
            <Select label="Mode" value={draft.illum_strip.mode} options={ILLUM_MODES} onChange={(v) => updateIllum("mode", v)} />
            <Slider label="Brightness" value={draft.illum_strip.brightness} min={0} max={255} step={1} onChange={(v) => updateIllum("brightness", v)} />
            {(draft.illum_strip.mode === "solid" || draft.illum_strip.mode === "breathing" || draft.illum_strip.mode === "chase") && (
              <ColorInput label="Color" value={draft.illum_strip.color} onChange={(c) => updateIllum("color", c)} />
            )}
            {draft.illum_strip.mode !== "off" && draft.illum_strip.mode !== "solid" && (
              <Slider label="Speed" value={draft.illum_strip.speed} min={0.005} max={0.5} step={0.005} onChange={(v) => updateIllum("speed", v)} />
            )}
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => onSave(selectedId, draft)}
              style={{
                flex: 1,
                padding: "10px",
                background: "#2563eb",
                color: "#fff",
                border: "none",
                borderRadius: 6,
                cursor: "pointer",
                fontWeight: 600,
                fontSize: 14,
              }}
            >
              Save
            </button>
            <button
              onClick={() => {
                if (confirm(`Delete "${draft.name}"?`)) onDelete(selectedId);
              }}
              style={{
                padding: "10px 16px",
                background: "#7f1d1d",
                color: "#fca5a5",
                border: "1px solid #991b1b",
                borderRadius: 6,
                cursor: "pointer",
                fontSize: 14,
              }}
            >
              Delete
            </button>
          </div>
        </>
      )}
    </div>
  );
}
