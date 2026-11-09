import csv
import io
from typing import Any, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.core.security import require_admin
from app.db.session import get_db
from app.models.audit_log import AuditLog
from app.models.models import (
    DonationRequest,
    FoodListing,
    Notification,
    User,
    VolunteerHandover,
)
from app.models.platform_setting import PlatformSetting

router = APIRouter(prefix="/database", tags=["Admin Database Management"])

ENTITY_MAP = {
    "users": User,
    "food_listings": FoodListing,
    "donation_requests": DonationRequest,
    "volunteer_handovers": VolunteerHandover,
    "notifications": Notification,
    "audit_logs": AuditLog,
    "platform_settings": PlatformSetting,
}

FORBIDDEN_COLUMNS = {"hashed_password", "password", "secret_key", "access_token"}


def _sanitize_row(obj: Any) -> dict:
    data = {}
    for col in obj.__table__.columns:
        if col.name.lower() in FORBIDDEN_COLUMNS:
            continue
        val = getattr(obj, col.name)
        data[col.name] = val
    return data


@router.get("/tables")
def get_database_tables(
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    tables = []
    for name, model in ENTITY_MAP.items():
        count = db.query(model).count()
        columns = [
            c.name for c in model.__table__.columns if c.name.lower() not in FORBIDDEN_COLUMNS
        ]
        tables.append(
            {
                "entity": name,
                "row_count": count,
                "columns": columns,
            }
        )
    return {"tables": tables}


@router.get("/stats")
def get_database_stats(
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    counts = {name: db.query(model).count() for name, model in ENTITY_MAP.items()}
    return {
        "table_counts": counts,
        "total_records": sum(counts.values()),
        "engine": "SQLAlchemy ORM (Sanitized Read/Export)",
    }


@router.get("/export/{entity}")
def export_entity_csv(
    entity: str,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    model = ENTITY_MAP.get(entity)
    if not model:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=f"Unknown table entity '{entity}'."
        )

    rows = db.query(model).order_by(model.id.desc()).all()
    columns = [
        c.name for c in model.__table__.columns if c.name.lower() not in FORBIDDEN_COLUMNS
    ]

    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=columns)
    writer.writeheader()
    for r in rows:
        sanitized = _sanitize_row(r)
        writer.writerow({k: str(v) if v is not None else "" for k, v in sanitized.items()})

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={
            "Content-Disposition": f'attachment; filename="{entity}_export.csv"'
        },
    )


@router.get("/{entity}")
def inspect_entity_records(
    entity: str,
    search: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    model = ENTITY_MAP.get(entity)
    if not model:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=f"Unknown table entity '{entity}'."
        )

    all_rows = db.query(model).order_by(model.id.desc()).all()
    sanitized = [_sanitize_row(r) for r in all_rows]

    if search and search.strip():
        q = search.strip().lower()
        sanitized = [
            row
            for row in sanitized
            if any(q in str(val).lower() for val in row.values() if val is not None)
        ]

    total = len(sanitized)
    start = (page - 1) * page_size
    end = start + page_size
    columns = [
        c.name for c in model.__table__.columns if c.name.lower() not in FORBIDDEN_COLUMNS
    ]

    return {
        "entity": entity,
        "columns": columns,
        "items": sanitized[start:end],
        "total": total,
        "page": page,
        "page_size": page_size,
    }


@router.get("/{entity}/{record_id}")
def inspect_single_record(
    entity: str,
    record_id: int,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    model = ENTITY_MAP.get(entity)
    if not model:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=f"Unknown table entity '{entity}'."
        )

    row = db.query(model).filter(model.id == record_id).first()
    if not row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Record #{record_id} not found in '{entity}'.",
        )

    return {
        "entity": entity,
        "record": _sanitize_row(row),
    }
