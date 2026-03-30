#!/usr/bin/env python3
"""
SpitClock — Config-driven NeoPixel ring clock.

Reads config.json for LED programs, colors, brightness, and time-based scheduling.
Drives a 36-LED NeoPixel ring (PWM) and a 16-LED illumination strip (SPI).

Usage:
    sudo ~/spitclock/venv/bin/python clock.py          # normal mode
    sudo ~/spitclock/venv/bin/python clock.py --test    # 24h in 24 seconds
"""

import colorsys
import json
import math
import os
import random
import signal
import sys
import time

import board
import neopixel
import rpi_ws281x

CONFIG_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "config.json")

# ── Defaults (used when no config.json exists) ──────────────────────────

DEFAULT_CONFIG = {
    "version": 1,
    "hardware": {
        "clock_ring": {
            "led_count": 36,
            "gpio_pin": 18,
            "led_order": "GRB",
            "twelve_o_clock_led": 0,
            "clockwise": True,
        },
        "illum_strip": {
            "led_count": 16,
            "gpio_pin": 10,
            "skip_first": 1,
            "dma": 10,
        },
    },
    "programs": {
        "clock_default": {
            "type": "clock",
            "name": "Default Clock",
            "clock_ring": {
                "brightness": 1.0,
                "hour_color": [150, 0, 0],
                "minute_color": [0, 150, 0],
                "second_color": [0, 50, 150],
                "bg_color": [0, 0, 0],
            },
            "illum_strip": {
                "brightness": 0,
                "color": [255, 0, 0],
                "mode": "off",
                "speed": 0.05,
            },
        }
    },
    "schedule": {
        "default_program": "clock_default",
        "rules": [],
    },
}


def load_config():
    """Load config.json, falling back to defaults."""
    if os.path.exists(CONFIG_PATH):
        try:
            with open(CONFIG_PATH) as f:
                return json.load(f)
        except (json.JSONDecodeError, OSError) as e:
            print(f"Warning: failed to read config.json: {e}")
    return DEFAULT_CONFIG


# ── Hardware init ────────────────────────────────────────────────────────

def init_clock_ring(hw):
    """Initialise the main NeoPixel clock ring."""
    order = getattr(neopixel, hw.get("led_order", "GRB"), neopixel.GRB)
    pixels = neopixel.NeoPixel(
        board.D18,
        hw["led_count"],
        brightness=1.0,
        auto_write=False,
        pixel_order=order,
    )
    return pixels


def init_illum_strip(hw):
    """Initialise the illumination strip on SPI."""
    strip = rpi_ws281x.PixelStrip(
        hw["led_count"],
        hw["gpio_pin"],
        freq_hz=800000,
        dma=hw.get("dma", 10),
        invert=False,
        brightness=255,
        channel=0,
        strip_type=rpi_ws281x.WS2812_STRIP,
    )
    strip.begin()
    return strip


# ── LED math ─────────────────────────────────────────────────────────────

def clamp(v):
    return max(0, min(255, int(v)))


def scale_color(color, factor):
    return tuple(clamp(c * factor) for c in color)


def physical_led(logical, led_count, clockwise, twelve_led):
    idx = logical % led_count
    if not clockwise:
        idx = (led_count - idx) % led_count
    return (idx + twelve_led) % led_count


# ── Schedule ─────────────────────────────────────────────────────────────

def time_to_minutes(t_str):
    h, m = t_str.split(":")
    return int(h) * 60 + int(m)


def get_active_program(config):
    """Return the program dict for the current time."""
    schedule = config.get("schedule", {})
    programs = config.get("programs", {})
    default_id = schedule.get("default_program", "clock_default")

    now = time.localtime()
    now_min = now.tm_hour * 60 + now.tm_min
    day_name = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"][now.tm_wday]

    for rule in schedule.get("rules", []):
        # Day filter
        days = rule.get("days")
        if days and day_name not in days:
            continue

        start = time_to_minutes(rule["start"])
        end = time_to_minutes(rule["end"])
        program_id = rule["program"]

        if start <= end:
            if start <= now_min < end and program_id in programs:
                return programs[program_id]
        else:
            # Overnight rule (e.g., 22:00–07:00)
            if (now_min >= start or now_min < end) and program_id in programs:
                return programs[program_id]

    return programs.get(default_id, list(programs.values())[0] if programs else DEFAULT_CONFIG["programs"]["clock_default"])


# ── Renderers ────────────────────────────────────────────────────────────

def render_clock(pixels, illum_strip, program, hw, now_seconds):
    """Render clock hands mode."""
    ring = program["clock_ring"]
    hw_ring = hw["clock_ring"]
    led_count = hw_ring["led_count"]
    clockwise = hw_ring["clockwise"]
    twelve = hw_ring["twelve_o_clock_led"]
    brightness = ring.get("brightness", 1.0)

    total = now_seconds % 86400
    hours = total / 3600
    minutes = (total % 3600) / 60
    seconds = total % 60

    hour_frac = (hours % 12) / 12.0
    min_frac = minutes / 60.0
    sec_frac = seconds / 60.0

    hour_led = round(hour_frac * led_count) % led_count
    min_led = round(min_frac * led_count) % led_count
    sec_led = round(sec_frac * led_count) % led_count

    bg = tuple(ring.get("bg_color", [0, 0, 0]))
    colors = [scale_color(bg, brightness)] * led_count

    for led, key in [(sec_led, "second_color"), (min_led, "minute_color"), (hour_led, "hour_color")]:
        c = tuple(ring.get(key, [100, 100, 100]))
        colors[physical_led(led, led_count, clockwise, twelve)] = scale_color(c, brightness)

    for i in range(led_count):
        pixels[i] = colors[i]
    pixels.show()

    render_illum(illum_strip, program, hw, now_seconds)


def render_solid(pixels, illum_strip, program, hw, now_seconds):
    """Render solid color mode — all ring LEDs same color."""
    ring = program["clock_ring"]
    led_count = hw["clock_ring"]["led_count"]
    brightness = ring.get("brightness", 1.0)
    color = tuple(ring.get("bg_color", [255, 255, 255]))
    scaled = scale_color(color, brightness)

    for i in range(led_count):
        pixels[i] = scaled
    pixels.show()

    render_illum(illum_strip, program, hw, now_seconds)


def render_effect(pixels, illum_strip, program, hw, now_seconds):
    """Render effect mode on the ring."""
    led_count = hw["clock_ring"]["led_count"]
    effect = program.get("effect", "rainbow_cycle")
    speed = program.get("effect_speed", 0.05)
    brightness = program["clock_ring"].get("brightness", 1.0)

    if effect == "rainbow_cycle":
        offset = now_seconds * speed
        for i in range(led_count):
            hue = (i / led_count + offset) % 1.0
            r, g, b = colorsys.hsv_to_rgb(hue, 1.0, 1.0)
            pixels[i] = scale_color((int(r * 255), int(g * 255), int(b * 255)), brightness)

    elif effect == "breathing":
        color = tuple(program["clock_ring"].get("bg_color", [150, 0, 150]))
        phase = (math.sin(now_seconds * speed * math.pi * 2) + 1) / 2
        for i in range(led_count):
            pixels[i] = scale_color(color, brightness * phase)

    elif effect == "chase":
        color = tuple(program["clock_ring"].get("bg_color", [0, 150, 255]))
        pos = int(now_seconds * speed * 30) % led_count
        for i in range(led_count):
            pixels[i] = (0, 0, 0)
        pixels[pos] = scale_color(color, brightness)

    elif effect == "sparkle":
        color = tuple(program["clock_ring"].get("bg_color", [255, 255, 255]))
        rng = random.Random(int(now_seconds * 10))
        for i in range(led_count):
            if rng.random() < 0.15:
                pixels[i] = scale_color(color, brightness * rng.uniform(0.3, 1.0))
            else:
                pixels[i] = (0, 0, 0)

    elif effect == "fire":
        rng = random.Random(int(now_seconds * 15))
        for i in range(led_count):
            heat = rng.uniform(0.2, 1.0)
            pixels[i] = scale_color((int(255 * heat), int(80 * heat * heat), 0), brightness)

    pixels.show()
    render_illum(illum_strip, program, hw, now_seconds)


def render_custom(pixels, illum_strip, program, hw):
    """Render custom per-LED colors."""
    led_count = hw["clock_ring"]["led_count"]
    ring_colors = program.get("custom_ring_colors") or []

    for i in range(led_count):
        if i < len(ring_colors) and ring_colors[i]:
            pixels[i] = tuple(ring_colors[i])
        else:
            pixels[i] = (0, 0, 0)
    pixels.show()

    illum_count = hw["illum_strip"]["led_count"]
    illum_colors = program.get("custom_illum_colors") or []
    for i in range(illum_count):
        if i < len(illum_colors) and illum_colors[i]:
            c = illum_colors[i]
            illum_strip.setPixelColor(i, rpi_ws281x.Color(c[0], c[1], c[2]))
        else:
            illum_strip.setPixelColor(i, rpi_ws281x.Color(0, 0, 0))
    illum_strip.show()


def render_illum(illum_strip, program, hw, now_seconds):
    """Render illumination strip based on program config."""
    illum = program.get("illum_strip", {})
    hw_illum = hw["illum_strip"]
    count = hw_illum["led_count"]
    skip = hw_illum.get("skip_first", 1)
    brightness = illum.get("brightness", 0) / 255.0
    mode = illum.get("mode", "off")
    color = tuple(illum.get("color", [255, 0, 0]))

    for i in range(count):
        illum_strip.setPixelColor(i, rpi_ws281x.Color(0, 0, 0))

    if mode == "off" or brightness <= 0:
        illum_strip.show()
        return

    if mode == "solid":
        c = scale_color(color, brightness)
        for i in range(skip, count):
            illum_strip.setPixelColor(i, rpi_ws281x.Color(c[0], c[1], c[2]))

    elif mode == "rainbow_cycle":
        speed = illum.get("speed", 0.05)
        offset = now_seconds * speed
        active = count - skip
        for i in range(skip, count):
            hue = ((i - skip) / active + offset) % 1.0
            r, g, b = colorsys.hsv_to_rgb(hue, 1.0, 1.0)
            c = scale_color((int(r * 255), int(g * 255), int(b * 255)), brightness)
            illum_strip.setPixelColor(i, rpi_ws281x.Color(c[0], c[1], c[2]))

    elif mode == "breathing":
        speed = illum.get("speed", 0.05)
        phase = (math.sin(now_seconds * speed * math.pi * 2) + 1) / 2
        c = scale_color(color, brightness * phase)
        for i in range(skip, count):
            illum_strip.setPixelColor(i, rpi_ws281x.Color(c[0], c[1], c[2]))

    elif mode == "chase":
        speed = illum.get("speed", 0.05)
        active = count - skip
        pos = int(now_seconds * speed * 20) % active
        c = scale_color(color, brightness)
        illum_strip.setPixelColor(skip + pos, rpi_ws281x.Color(c[0], c[1], c[2]))

    illum_strip.show()


# ── Main loop ────────────────────────────────────────────────────────────

def run_clock(test_mode=False):
    config = load_config()
    hw = config["hardware"]

    pixels = init_clock_ring(hw["clock_ring"])
    illum_strip = init_illum_strip(hw["illum_strip"])

    # Reload config on SIGHUP
    def handle_sighup(signum, frame):
        nonlocal config
        print("Reloading config...")
        config = load_config()

    signal.signal(signal.SIGHUP, handle_sighup)

    print(f"SpitClock — {hw['clock_ring']['led_count']} ring + {hw['illum_strip']['led_count']} illum LEDs")
    print(f"Config: {CONFIG_PATH}")
    if test_mode:
        print("TEST MODE — 24h in 24 seconds")
    print("Press Ctrl+C to stop.\n")

    last_schedule_check = 0
    active_program = None

    try:
        if test_mode:
            start = time.monotonic()

        while True:
            now_mono = time.monotonic()
            if now_mono - last_schedule_check > 30:
                config = load_config()
                active_program = get_active_program(config)
                last_schedule_check = now_mono
                hw = config["hardware"]

            if active_program is None:
                active_program = get_active_program(config)

            ptype = active_program.get("type", "clock")

            if test_mode:
                elapsed = time.monotonic() - start
                if elapsed > 24:
                    start = time.monotonic()
                    elapsed = 0
                now_seconds = elapsed * 3600
            else:
                now = time.localtime()
                now_seconds = now.tm_hour * 3600 + now.tm_min * 60 + now.tm_sec + time.time() % 1

            if ptype == "clock":
                render_clock(pixels, illum_strip, active_program, hw, now_seconds)
            elif ptype == "solid":
                render_solid(pixels, illum_strip, active_program, hw, now_seconds)
            elif ptype == "effect":
                render_effect(pixels, illum_strip, active_program, hw, now_seconds)
            elif ptype == "custom":
                render_custom(pixels, illum_strip, active_program, hw)

            time.sleep(0.05)

    except KeyboardInterrupt:
        print("\nShutting down...")
        pixels.fill((0, 0, 0))
        pixels.show()
        for i in range(illum_strip.numPixels()):
            illum_strip.setPixelColor(i, rpi_ws281x.Color(0, 0, 0))
        illum_strip.show()


if __name__ == "__main__":
    test = "--test" in sys.argv
    run_clock(test_mode=test)
