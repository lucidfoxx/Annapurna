from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.security import require_admin
from app.db.session import get_db
from app.models.audit_log import AuditLog
from app.models.models import User

router = APIRouter(prefix="/audit-logs", tags=["Admin Audit Logs"])


@router.get("")
def list_audit_logs(
    search: Optional[str] = Query(None),
    action: Optional[str] = Query(None),
    entity_type: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    query = db.query(AuditLog)

    if search and search.strip():
        q = f"%{search.strip().lower()}%"
        query = query.filter(
            func.lower(AuditLog.admin_email).like(q)
            | func.lower(AuditLog.action).like(q)
            | func.lower(AuditLog.entity_type).like(q)
            | func.lower(AuditLog.entity_id).like(q)
        )

    if action and action.lower() != "all":
        query = query.filter(func.lower(AuditLog.action) == action.strip().lower())

    if entity_type and entity_type.lower() != "all":
        query = query.filter(
            func.lower(AuditLog.entity_type) == entity_type.strip().lower()
        )

    total = query.count()
    items = (
        query.order_by(AuditLog.id.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    return {
        "items": [
            {
                "id": a.id,
                "admin_id": a.admin_id,
                "admin_email": a.admin_email,
                "action": a.action,
                "entity_type": a.entity_type,
                "entity_id": a.entity_id,
                "previous_value": a.previous_value,
                "new_value": a.new_value,
                "ip_address": a.ip_address,
                "user_agent": a.user_agent,
                "created_at": a.created_at,
            }
            for a in items
        ],
        "total": total,
        "page": page,
        "page_size": page_size,
    }
