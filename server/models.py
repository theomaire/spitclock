"""Pydantic models for SpitClock configuration."""

from __future__ import annotations

from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Color type
# ---------------------------------------------------------------------------

Color = tuple[int, int, int]


# ---------------------------------------------------------------------------
# Hardware
# ---------------------------------------------------------------------------

class ClockRingHardware(BaseModel):
    led_count: int = 36
    gpio_pin: int = 18
    led_order: str = "GRB"
    twelve_o_clock_led: int = 0
    clockwise: bool = True


class IllumStripHardware(BaseModel):
    led_count: int = 16
    gpio_pin: int = 10
    skip_first: int = 1
    dma: int = 10


class Hardware(BaseModel):
    clock_ring: ClockRingHardware = ClockRingHardware()
    illum_strip: IllumStripHardware = IllumStripHardware()


# ---------------------------------------------------------------------------
# Programs
# ---------------------------------------------------------------------------

class ProgramType(str, Enum):
    clock = "clock"
    solid = "solid"
    effect = "effect"
    custom = "custom"


class IllumStripMode(str, Enum):
    off = "off"
    solid = "solid"
    rainbow_cycle = "rainbow_cycle"
    breathing = "breathing"
    chase = "chase"


class EffectType(str, Enum):
    rainbow_cycle = "rainbow_cycle"
    breathing = "breathing"
    chase = "chase"
    sparkle = "sparkle"
    fire = "fire"


class ClockRingConfig(BaseModel):
    brightness: float = Field(1.0, ge=0.0, le=1.0)
    hour_color: Color = (150, 0, 0)
    minute_color: Color = (0, 150, 0)
    second_color: Color = (0, 50, 150)
    bg_color: Color = (0, 0, 0)


class IllumStripConfig(BaseModel):
    brightness: int = Field(0, ge=0, le=255)
    color: Color = (255, 0, 0)
    mode: IllumStripMode = IllumStripMode.off
    speed: float = Field(0.05, ge=0.001, le=1.0)


class Program(BaseModel):
    type: ProgramType = ProgramType.clock
    name: str = "Untitled"
    clock_ring: ClockRingConfig = ClockRingConfig()
    illum_strip: IllumStripConfig = IllumStripConfig()
    # For effect type
    effect: Optional[EffectType] = None
    effect_speed: float = Field(0.05, ge=0.001, le=1.0)
    # For custom type — per-LED color arrays
    custom_ring_colors: Optional[list[Color]] = None
    custom_illum_colors: Optional[list[Color]] = None


# ---------------------------------------------------------------------------
# Schedule
# ---------------------------------------------------------------------------

class ScheduleRule(BaseModel):
    start: str = Field(..., pattern=r"^\d{2}:\d{2}$")
    end: str = Field(..., pattern=r"^\d{2}:\d{2}$")
    program: str
    days: Optional[list[str]] = None  # e.g. ["monday", "friday"]


class Schedule(BaseModel):
    default_program: str = "clock_default"
    rules: list[ScheduleRule] = []


# ---------------------------------------------------------------------------
# Connection
# ---------------------------------------------------------------------------

class Connection(BaseModel):
    tailscale_ip: str = "100.92.33.66"
    local_hostname: str = "pizero.local"
    username: str = "pi"
    remote_path: str = "/home/pi/spitclock"


# ---------------------------------------------------------------------------
# Root config
# ---------------------------------------------------------------------------

class SpitClockConfig(BaseModel):
    version: int = 1
    hardware: Hardware = Hardware()
    programs: dict[str, Program] = {}
    schedule: Schedule = Schedule()
    connection: Connection = Connection()
