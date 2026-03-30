"""WebSocket endpoint for real-time LED preview."""

from __future__ import annotations

import asyncio
import colorsys
import math
import time

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from ..config_store import load_config
from ..models import EffectType, IllumStripMode, ProgramType

router = APIRouter(tags=["preview"])

Color = tuple[int, int, int]


def _clamp(v: int) -> int:
    return max(0, min(255, v))


def _scale(color: Color, factor: float) -> Color:
    return tuple(_clamp(int(c * factor)) for c in color)


# ---------------------------------------------------------------------------
# Clock mode
# ---------------------------------------------------------------------------

def compute_clock_leds(
    program: dict,
    hardware: dict,
    now_seconds: float,
) -> tuple[list[Color], list[Color]]:
    """Compute LED colors for clock mode at a given time."""
    ring = program["clock_ring"]
    led_count = hardware["clock_ring"]["led_count"]
    clockwise = hardware["clock_ring"]["clockwise"]
    twelve = hardware["clock_ring"]["twelve_o_clock_led"]

    total_sec = now_seconds % 86400
    hours = total_sec / 3600
    minutes = (total_sec % 3600) / 60
    seconds = total_sec % 60

    # Positions as fractions of the ring
    hour_frac = (hours % 12) / 12.0
    min_frac = minutes / 60.0
    sec_frac = seconds / 60.0

    hour_led = round(hour_frac * led_count) % led_count
    min_led = round(min_frac * led_count) % led_count
    sec_led = round(sec_frac * led_count) % led_count

    def physical(logical: int) -> int:
        idx = logical % led_count
        if not clockwise:
            idx = (led_count - idx) % led_count
        return (idx + twelve) % led_count

    bg = tuple(ring.get("bg_color", [0, 0, 0]))
    brightness = ring.get("brightness", 1.0)

    ring_colors = [_scale(bg, brightness)] * led_count

    # Draw hands (second first, hour on top)
    for led, color_key in [
        (sec_led, "second_color"),
        (min_led, "minute_color"),
        (hour_led, "hour_color"),
    ]:
        c = tuple(ring.get(color_key, [100, 100, 100]))
        ring_colors[physical(led)] = _scale(c, brightness)

    # Illum strip
    illum_colors = compute_illum_leds(program, hardware, now_seconds)

    return ring_colors, illum_colors


# ---------------------------------------------------------------------------
# Illumination strip
# ---------------------------------------------------------------------------

def compute_illum_leds(
    program: dict,
    hardware: dict,
    now_seconds: float,
) -> list[Color]:
    """Compute illumination strip colors."""
    illum = program.get("illum_strip", {})
    hw = hardware["illum_strip"]
    count = hw["led_count"]
    skip = hw.get("skip_first", 1)
    brightness = illum.get("brightness", 0) / 255.0
    mode = illum.get("mode", "off")
    color = tuple(illum.get("color", [255, 0, 0]))

    colors: list[Color] = [(0, 0, 0)] * count

    if mode == "off" or brightness <= 0:
        return colors

    if mode == "solid":
        for i in range(skip, count):
            colors[i] = _scale(color, brightness)

    elif mode == "rainbow_cycle":
        speed = illum.get("speed", 0.05)
        offset = now_seconds * speed
        for i in range(skip, count):
            hue = (i / (count - skip) + offset) % 1.0
            r, g, b = colorsys.hsv_to_rgb(hue, 1.0, 1.0)
            colors[i] = _scale((int(r * 255), int(g * 255), int(b * 255)), brightness)

    elif mode == "breathing":
        speed = illum.get("speed", 0.05)
        phase = (math.sin(now_seconds * speed * math.pi * 2) + 1) / 2
        for i in range(skip, count):
            colors[i] = _scale(color, brightness * phase)

    elif mode == "chase":
        speed = illum.get("speed", 0.05)
        active_count = count - skip
        pos = int(now_seconds * speed * 20) % active_count
        for i in range(skip, count):
            if (i - skip) == pos:
                colors[i] = _scale(color, brightness)

    return colors


# ---------------------------------------------------------------------------
# Effect mode (clock ring)
# ---------------------------------------------------------------------------

def compute_effect_ring(
    program: dict,
    hardware: dict,
    now_seconds: float,
) -> list[Color]:
    """Compute ring colors for effect mode."""
    led_count = hardware["clock_ring"]["led_count"]
    effect = program.get("effect", "rainbow_cycle")
    speed = program.get("effect_speed", 0.05)
    brightness = program["clock_ring"].get("brightness", 1.0)

    colors: list[Color] = [(0, 0, 0)] * led_count

    if effect == "rainbow_cycle":
        offset = now_seconds * speed
        for i in range(led_count):
            hue = (i / led_count + offset) % 1.0
            r, g, b = colorsys.hsv_to_rgb(hue, 1.0, 1.0)
            colors[i] = _scale((int(r * 255), int(g * 255), int(b * 255)), brightness)

    elif effect == "breathing":
        color = tuple(program["clock_ring"].get("bg_color", [150, 0, 150]))
        phase = (math.sin(now_seconds * speed * math.pi * 2) + 1) / 2
        for i in range(led_count):
            colors[i] = _scale(color, brightness * phase)

    elif effect == "chase":
        color = tuple(program["clock_ring"].get("bg_color", [0, 150, 255]))
        pos = int(now_seconds * speed * 30) % led_count
        colors[pos] = _scale(color, brightness)

    elif effect == "sparkle":
        import random
        color = tuple(program["clock_ring"].get("bg_color", [255, 255, 255]))
        # Deterministic sparkle based on time
        seed = int(now_seconds * 10)
        rng = random.Random(seed)
        for i in range(led_count):
            if rng.random() < 0.15:
                colors[i] = _scale(color, brightness * rng.uniform(0.3, 1.0))

    elif effect == "fire":
        import random
        rng = random.Random(int(now_seconds * 15))
        for i in range(led_count):
            heat = rng.uniform(0.2, 1.0)
            r = int(255 * heat)
            g = int(80 * heat * heat)
            b = 0
            colors[i] = _scale((r, g, b), brightness)

    return colors


# ---------------------------------------------------------------------------
# Solid mode
# ---------------------------------------------------------------------------

def compute_solid_leds(
    program: dict,
    hardware: dict,
    now_seconds: float,
) -> tuple[list[Color], list[Color]]:
    """All ring LEDs set to the background color."""
    ring = program["clock_ring"]
    led_count = hardware["clock_ring"]["led_count"]
    brightness = ring.get("brightness", 1.0)
    color = tuple(ring.get("bg_color", [255, 255, 255]))

    ring_colors = [_scale(color, brightness)] * led_count
    illum_colors = compute_illum_leds(program, hardware, now_seconds)
    return ring_colors, illum_colors


# ---------------------------------------------------------------------------
# Custom mode
# ---------------------------------------------------------------------------

def compute_custom_leds(
    program: dict,
    hardware: dict,
) -> tuple[list[Color], list[Color]]:
    """Per-LED custom colors."""
    led_count = hardware["clock_ring"]["led_count"]
    illum_count = hardware["illum_strip"]["led_count"]

    ring_raw = program.get("custom_ring_colors") or []
    illum_raw = program.get("custom_illum_colors") or []

    ring_colors = [tuple(c) if c else (0, 0, 0) for c in ring_raw]
    ring_colors.extend([(0, 0, 0)] * (led_count - len(ring_colors)))
    ring_colors = ring_colors[:led_count]

    illum_colors = [tuple(c) if c else (0, 0, 0) for c in illum_raw]
    illum_colors.extend([(0, 0, 0)] * (illum_count - len(illum_colors)))
    illum_colors = illum_colors[:illum_count]

    return ring_colors, illum_colors


# ---------------------------------------------------------------------------
# Main dispatcher
# ---------------------------------------------------------------------------

def compute_frame(
    program: dict,
    hardware: dict,
    now_seconds: float,
) -> dict:
    """Compute a single frame for preview."""
    ptype = program.get("type", "clock")

    if ptype == "clock":
        ring, illum = compute_clock_leds(program, hardware, now_seconds)
    elif ptype == "solid":
        ring, illum = compute_solid_leds(program, hardware, now_seconds)
    elif ptype == "effect":
        ring = compute_effect_ring(program, hardware, now_seconds)
        illum = compute_illum_leds(program, hardware, now_seconds)
    elif ptype == "custom":
        ring, illum = compute_custom_leds(program, hardware)
    else:
        led_count = hardware["clock_ring"]["led_count"]
        illum_count = hardware["illum_strip"]["led_count"]
        ring = [(0, 0, 0)] * led_count
        illum = [(0, 0, 0)] * illum_count

    return {"ring": ring, "illum": illum}


# ---------------------------------------------------------------------------
# WebSocket
# ---------------------------------------------------------------------------

@router.websocket("/api/preview/ws")
async def preview_ws(websocket: WebSocket):
    await websocket.accept()
    cfg = load_config()
    hardware = cfg.hardware.model_dump()
    # Default to previewing the default scheduled program
    program_id = cfg.schedule.default_program
    program = cfg.programs.get(program_id)
    if program is None and cfg.programs:
        program = next(iter(cfg.programs.values()))

    try:
        while True:
            # Check for incoming messages (program switch, config reload)
            try:
                msg = await asyncio.wait_for(websocket.receive_json(), timeout=0.04)
                if "program_id" in msg:
                    cfg = load_config()
                    hardware = cfg.hardware.model_dump()
                    pid = msg["program_id"]
                    if pid in cfg.programs:
                        program = cfg.programs[pid]
                        program_id = pid
                elif msg.get("action") == "reload":
                    cfg = load_config()
                    hardware = cfg.hardware.model_dump()
                    if program_id in cfg.programs:
                        program = cfg.programs[program_id]
            except asyncio.TimeoutError:
                pass

            if program is None:
                await asyncio.sleep(0.05)
                continue

            now = time.time()
            frame = compute_frame(program.model_dump(), hardware, now)
            await websocket.send_json(frame)

    except WebSocketDisconnect:
        pass
