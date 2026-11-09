import json
import re
from typing import Any, Optional
from fastapi import Request
from sqlalchemy.orm import Session

from app.models.audit_log import AuditLog
from app.models.models import User


def _serialize_safe(val: Any) -> Optional[str]:
    if val is None:
        return None
    if isinstance(val, str):
        return val
    try:
        if isinstance(val, dict):
            cleaned = {
                k: v
                for k, v in val.items()
                if k.lower() not in ("password", "hashed_password", "token", "access_token", "secret_key")
            }
            return json.dumps(cleaned, default=str)
        return json.dumps(val, default=str)
    except Exception:
        return str(val)


def log_admin_action(
    db: Session,
    admin: User,
    action: str,
    entity_type: str,
    entity_id: Any,
    previous_value: Any = None,
    new_value: Any = None,
    request: Optional[Request] = None,
) -> AuditLog:
    ip_addr = None
    user_agent = None
    if request is not None:
        ip_addr = request.client.host if request.client else None
        user_agent = (request.headers.get("user-agent") or "")[:250] or None

    entry = AuditLog(
        admin_id=admin.id,
        admin_email=admin.email,
        action=action,
        entity_type=entity_type,
        entity_id=str(entity_id),
        previous_value=_serialize_safe(previous_value),
        new_value=_serialize_safe(new_value),
        ip_address=ip_addr,
        user_agent=user_agent,
    )
    db.add(entry)
    return entry


def parse_numeric_quantity(raw: Optional[str]) -> float:
    if not raw:
        return 1.0
    match = re.search(r"(\d+(?:\.\d+)?)", str(raw))
    if match:
        try:
            return float(match.group(1))
        except ValueError:
            return 1.0
    return 1.0
