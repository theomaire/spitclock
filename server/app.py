"""SpitClock web application — FastAPI backend serving React frontend."""

from __future__ import annotations

import webbrowser
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .api import connection, deploy, preview, programs, schedule
from .config_store import DEFAULT_CONFIG_PATH, load_config, save_config

FRONTEND_DIST = Path(__file__).resolve().parent.parent / "frontend" / "dist"


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure config.json exists on startup
    if not DEFAULT_CONFIG_PATH.exists():
        save_config(load_config())
    yield


def create_app() -> FastAPI:
    app = FastAPI(title="SpitClock", version="0.1.0", lifespan=lifespan)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # API routes
    app.include_router(programs.router)
    app.include_router(schedule.router)
    app.include_router(preview.router)
    app.include_router(connection.router)
    app.include_router(deploy.router)

    # Hardware config endpoint
    @app.get("/api/hardware")
    def get_hardware():
        cfg = load_config()
        return cfg.hardware

    # Full config endpoint (for export/debug)
    @app.get("/api/config")
    def get_config():
        return load_config()

    # Serve React frontend (production build)
    if FRONTEND_DIST.exists():
        @app.get("/{path:path}")
        async def spa_fallback(path: str):
            from fastapi.responses import FileResponse

            file_path = FRONTEND_DIST / path
            if file_path.is_file():
                return FileResponse(file_path)
            return FileResponse(FRONTEND_DIST / "index.html")

    return app


app = create_app()


def main():
    """CLI entry point — launch the server and open the browser."""
    import uvicorn

    print("🕐 SpitClock — LED Clock Programmer")
    print("    http://localhost:8421")
    print("    Press Ctrl+C to stop.\n")

    webbrowser.open("http://localhost:8421")
    uvicorn.run(
        "server.app:app",
        host="0.0.0.0",
        port=8421,
        reload=False,
        log_level="info",
    )


if __name__ == "__main__":
    main()
