#!/usr/bin/env bash
set -euo pipefail

echo "=== SpitClock Installer ==="
echo ""

# Check Python
if ! command -v python3 &>/dev/null; then
    echo "Error: Python 3.10+ required. Install from https://python.org"
    exit 1
fi

PY_VERSION=$(python3 -c 'import sys; print(f"{sys.version_info.major}.{sys.version_info.minor}")')
echo "Python: $PY_VERSION"

# Check Node
if ! command -v node &>/dev/null; then
    echo "Error: Node.js 18+ required. Install from https://nodejs.org"
    exit 1
fi

NODE_VERSION=$(node -v)
echo "Node: $NODE_VERSION"

# Find repo root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(dirname "$SCRIPT_DIR")"
cd "$REPO_DIR"
echo "Repo: $REPO_DIR"
echo ""

# Install Python package
echo "Installing Python dependencies..."
pip install -e . --quiet

# Build frontend
echo "Building frontend..."
cd frontend
npm install --silent
npm run build
cd ..

echo ""
echo "=== Done! ==="
echo ""
echo "Run 'spitclock' to launch the LED programmer."
echo "It will open http://localhost:8421 in your browser."
