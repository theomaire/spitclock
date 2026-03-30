"""Load/save SpitClock config.json."""

from __future__ import annotations

import json
from pathlib import Path

from .models import (
    ClockRingConfig,
    Connection,
    IllumStripConfig,
    IllumStripMode,
    Program,
    ProgramType,
    Schedule,
    SpitClockConfig,
)

DEFAULT_CONFIG_PATH = Path(__file__).resolve().parent.parent / "config.json"


def default_config() -> SpitClockConfig:
    """Return a fresh config with sensible defaults."""
    return SpitClockConfig(
        programs={
            "clock_default": Program(
                type=ProgramType.clock,
                name="Default Clock",
                clock_ring=ClockRingConfig(
                    brightness=1.0,
                    hour_color=(150, 0, 0),
                    minute_color=(0, 150, 0),
                    second_color=(0, 50, 150),
                    bg_color=(0, 0, 0),
                ),
                illum_strip=IllumStripConfig(
                    brightness=0,
                    color=(255, 0, 0),
                    mode=IllumStripMode.off,
                ),
            ),
            "night_mode": Program(
                type=ProgramType.clock,
                name="Night Mode",
                clock_ring=ClockRingConfig(
                    brightness=0.3,
                    hour_color=(40, 0, 0),
                    minute_color=(0, 40, 0),
                    second_color=(0, 0, 40),
                    bg_color=(0, 0, 0),
                ),
                illum_strip=IllumStripConfig(
                    brightness=0,
                    color=(0, 0, 0),
                    mode=IllumStripMode.off,
                ),
            ),
            "rainbow_party": Program(
                type=ProgramType.effect,
                name="Rainbow Party",
                effect="rainbow_cycle",
                effect_speed=0.02,
                clock_ring=ClockRingConfig(brightness=1.0),
                illum_strip=IllumStripConfig(
                    brightness=128,
                    mode=IllumStripMode.rainbow_cycle,
                    speed=0.02,
                ),
            ),
            "warm_glow": Program(
                type=ProgramType.solid,
                name="Warm Glow",
                clock_ring=ClockRingConfig(
                    brightness=0.5,
                    bg_color=(255, 120, 30),
                ),
                illum_strip=IllumStripConfig(
                    brightness=80,
                    color=(255, 100, 20),
                    mode=IllumStripMode.solid,
                ),
            ),
        },
        schedule=Schedule(
            default_program="clock_default",
            rules=[],
        ),
        connection=Connection(),
    )


def load_config(path: Path = DEFAULT_CONFIG_PATH) -> SpitClockConfig:
    """Load config from disk, or return defaults if missing."""
    if path.exists():
        data = json.loads(path.read_text())
        return SpitClockConfig.model_validate(data)
    return default_config()


def save_config(config: SpitClockConfig, path: Path = DEFAULT_CONFIG_PATH) -> None:
    """Write config to disk."""
    path.write_text(
        json.dumps(config.model_dump(), indent=2) + "\n"
    )
