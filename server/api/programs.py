"""CRUD endpoints for LED programs."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException

from ..config_store import load_config, save_config
from ..models import Program

router = APIRouter(prefix="/api/programs", tags=["programs"])


@router.get("/")
def list_programs() -> dict[str, Program]:
    cfg = load_config()
    return cfg.programs


@router.get("/{program_id}")
def get_program(program_id: str) -> Program:
    cfg = load_config()
    if program_id not in cfg.programs:
        raise HTTPException(404, f"Program '{program_id}' not found")
    return cfg.programs[program_id]


@router.post("/{program_id}", status_code=201)
def create_program(program_id: str, program: Program) -> Program:
    cfg = load_config()
    if program_id in cfg.programs:
        raise HTTPException(409, f"Program '{program_id}' already exists")
    cfg.programs[program_id] = program
    save_config(cfg)
    return program


@router.put("/{program_id}")
def update_program(program_id: str, program: Program) -> Program:
    cfg = load_config()
    if program_id not in cfg.programs:
        raise HTTPException(404, f"Program '{program_id}' not found")
    cfg.programs[program_id] = program
    save_config(cfg)
    return program


@router.delete("/{program_id}", status_code=204)
def delete_program(program_id: str) -> None:
    cfg = load_config()
    if program_id not in cfg.programs:
        raise HTTPException(404, f"Program '{program_id}' not found")
    del cfg.programs[program_id]
    save_config(cfg)
