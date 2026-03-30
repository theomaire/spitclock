export type Color = [number, number, number];

export type ProgramType = "clock" | "solid" | "effect" | "custom";
export type IllumStripMode = "off" | "solid" | "rainbow_cycle" | "breathing" | "chase";
export type EffectType = "rainbow_cycle" | "breathing" | "chase" | "sparkle" | "fire";

export interface ClockRingConfig {
  brightness: number;
  hour_color: Color;
  minute_color: Color;
  second_color: Color;
  bg_color: Color;
}

export interface IllumStripConfig {
  brightness: number;
  color: Color;
  mode: IllumStripMode;
  speed: number;
}

export interface Program {
  type: ProgramType;
  name: string;
  clock_ring: ClockRingConfig;
  illum_strip: IllumStripConfig;
  effect?: EffectType | null;
  effect_speed: number;
  custom_ring_colors?: Color[] | null;
  custom_illum_colors?: Color[] | null;
}

export interface ScheduleRule {
  start: string;
  end: string;
  program: string;
  days?: string[] | null;
}

export type ChimeTrigger = "hour" | "half" | "quarter";

export interface ChimeRule {
  program: string;
  trigger: ChimeTrigger;
  duration: number;
  start_hour: number;
  end_hour: number;
}

export interface Schedule {
  default_program: string;
  rules: ScheduleRule[];
  chimes: ChimeRule[];
}

export interface ConnectionStatus {
  connected: boolean;
  method: string | null;
  host: string | null;
  latency_ms: number | null;
}

export interface ConnectionSettings {
  tailscale_ip: string;
  local_hostname: string;
  username: string;
  remote_path: string;
}

export interface PreviewFrame {
  ring: Color[];
  illum: Color[];
}

export interface DeployResult {
  success: boolean;
  service_status: string;
  message: string;
}
