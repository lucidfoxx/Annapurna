from fastapi import APIRouter

from app.routers.admin.dashboard import router as dashboard_router
from app.routers.admin.users import router as users_router
from app.routers.admin.listings import router as listings_router
from app.routers.admin.requests import router as requests_router
from app.routers.admin.volunteers import router as volunteers_router
from app.routers.admin.donations import router as donations_router
from app.routers.admin.database import router as database_router
from app.routers.admin.audit_logs import router as audit_logs_router
from app.routers.admin.settings import router as settings_router

admin_router = APIRouter(prefix="/admin")
admin_router.include_router(dashboard_router)
admin_router.include_router(users_router)
admin_router.include_router(listings_router)
admin_router.include_router(requests_router)
admin_router.include_router(volunteers_router)
admin_router.include_router(donations_router)
admin_router.include_router(database_router)
admin_router.include_router(audit_logs_router)
admin_router.include_router(settings_router)
