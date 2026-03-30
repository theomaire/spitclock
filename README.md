# SpitClock

A visual LED programmer for the SpitClock — a NeoPixel ring clock running on a Raspberry Pi Zero 2 W.

Design LED patterns, preview them live, schedule programs by time of day, and push everything to the clock with one click.

## Hardware

- **Clock ring**: 36 WS2812 LEDs on GPIO18 (PWM) — outer ring, facing inward
- **Illumination strip**: 16 WS2812 LEDs on GPIO10 (SPI) — inner ring, facing outward
- **Pi Zero 2 W** running Raspberry Pi OS, connected via Tailscale or local WiFi

## Quick Start

### Prerequisites

- Python 3.10+
- Node.js 18+
- SSH access to the Pi (key-based auth recommended)

### Install

```bash
git clone https://github.com/theomaire/spitclock.git
cd spitclock
pip install -e .
cd frontend && npm install && npm run build && cd ..
```

### Run

```bash
spitclock
```

Opens http://localhost:8421 in your browser.

## What You Can Do

**Programs** — Create LED programs with different modes:
- **Clock**: hour/minute/second hands with custom colors
- **Solid**: all LEDs one color
- **Effects**: rainbow cycle, breathing, chase, sparkle, fire
- **Custom**: set each LED individually

Each program independently controls both the outer clock ring and the inner illumination strip (brightness, color, mode, speed).

**Schedule** — Assign programs to times of day:
- Set a default program that runs 24/7
- Add time rules (e.g., "Night Mode" from 22:00 to 07:00)
- Filter by day of week

**Preview** — Live SVG visualization showing both concentric LED rings with glow effects, updating at ~20fps via WebSocket.

**Deploy** — One-click push to the Pi. Uploads `config.json` and restarts the service. Auto-discovers the Pi via Tailscale or local network.

## Architecture

The app runs entirely on your laptop. The Pi only runs a lightweight Python script that reads `config.json`.

```
laptop                          Pi Zero
┌──────────────────┐            ┌─────────────┐
│ React frontend   │            │ clock.py    │
│ FastAPI backend   │──SSH/SFTP──▶ config.json │
│ localhost:8421   │            │ 36+16 LEDs  │
└──────────────────┘            └─────────────┘
```

- `server/` — FastAPI backend (programs, schedule, preview, deploy)
- `frontend/` — React + Vite + TypeScript
- `pi/clock.py` — Config-driven LED runtime
- `config.json` — All settings, programs, and schedules

## Connection

The app auto-discovers the Pi by trying:
1. Tailscale IP (default: 100.92.33.66)
2. Local mDNS (default: pizero.local)

Configure these in the connection settings if your setup differs.

## Pi Setup

The Pi needs `neopixel`, `rpi_ws281x`, and `board` installed in a venv:

```bash
# On the Pi
cd ~/spitclock
python -m venv venv
source venv/bin/activate
pip install adafruit-circuitpython-neopixel rpi_ws281x
```

The systemd service should run:
```
ExecStart=/home/pi/spitclock/venv/bin/python /home/pi/spitclock/clock.py
```

## Development

Run backend and frontend separately for hot-reload:

```bash
# Terminal 1: backend
uvicorn server.app:app --host 0.0.0.0 --port 8421 --reload

# Terminal 2: frontend (proxies API to :8421)
cd frontend && npm run dev
```

## License

Private project.
