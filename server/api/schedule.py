"""Schedule management endpoints."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException

from ..config_store import load_config, save_config
from ..models import ChimeRule, Schedule, ScheduleRule

router = APIRouter(prefix="/api/schedule", tags=["schedule"])


@router.get("/")
def get_schedule() -> Schedule:
    cfg = load_config()
    return cfg.schedule


@router.put("/")
def update_schedule(schedule: Schedule) -> Schedule:
    cfg = load_config()
    # Validate that all referenced programs exist
    all_ids = set(cfg.programs.keys())
    if schedule.default_program not in all_ids:
        raise HTTPException(400, f"Default program '{schedule.default_program}' not found")
    for rule in schedule.rules:
        if rule.program not in all_ids:
            raise HTTPException(400, f"Program '{rule.program}' in rule not found")
    for chime in schedule.chimes:
        if chime.program not in all_ids:
            raise HTTPException(400, f"Program '{chime.program}' in chime not found")
    cfg.schedule = schedule
    save_config(cfg)
    return schedule


@router.post("/rules", status_code=201)
def add_rule(rule: ScheduleRule) -> Schedule:
    cfg = load_config()
    if rule.program not in cfg.programs:
        raise HTTPException(400, f"Program '{rule.program}' not found")
    cfg.schedule.rules.append(rule)
    save_config(cfg)
    return cfg.schedule


@router.delete("/rules/{index}", status_code=204)
def delete_rule(index: int) -> None:
    cfg = load_config()
    if index < 0 or index >= len(cfg.schedule.rules):
        raise HTTPException(404, "Rule index out of range")
    cfg.schedule.rules.pop(index)
    save_config(cfg)
