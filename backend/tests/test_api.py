import os

os.environ["DATABASE_URL"] = "sqlite:///./test_annapurna.db"

from fastapi.testclient import TestClient
from app.main import app
from app.db.base import Base
from app.db.session import engine
from app.db.create_tables import init_db

Base.metadata.create_all(bind=engine)
init_db()

client = TestClient(app)


def test_health():
    res = client.get("/api/health")
    assert res.status_code == 200
    assert res.json()["status"] == "ok"


def test_public_admin_registration_blocked():
    res = client.post(
        "/api/auth/register",
        json={
            "full_name": "Rogue Admin",
            "email": "rogue@annapurna.org",
            "password": "password123",
            "role": "Admin",
        },
    )
    assert res.status_code == 403


def test_admin_rbac_and_full_admin_platform():
    # 1. Verify non-admin roles (Donor, NGO, Volunteer) and unauthenticated users cannot access /api/admin/*
    unauth = client.get("/api/admin/dashboard/stats")
    assert unauth.status_code == 401

    donor_login = client.post(
        "/api/auth/login",
        data={"username": "donor1@shareplate.org", "password": "password123"},
    )
    assert donor_login.status_code == 200
    donor_token = donor_login.json()["access_token"]

    ngo_login = client.post(
        "/api/auth/login",
        data={"username": "ngo1@shareplate.org", "password": "password123"},
    )
    assert ngo_login.status_code == 200
    ngo_token = ngo_login.json()["access_token"]

    vol_login = client.post(
        "/api/auth/login",
        data={"username": "volunteer1@shareplate.org", "password": "password123"},
    )
    assert vol_login.status_code == 200
    vol_token = vol_login.json()["access_token"]

    for tok in (donor_token, ngo_token, vol_token):
        resp = client.get(
            "/api/admin/dashboard/stats",
            headers={"Authorization": f"Bearer {tok}"},
        )
        assert resp.status_code == 403

    # 2. Controlled one-time bootstrap of the first Administrator
    status_before = client.get("/api/auth/bootstrap-status").json()
    if not status_before["has_admin"]:
        boot_res = client.post(
            "/api/auth/bootstrap-admin",
            json={
                "full_name": "Platform Admin",
                "email": "admin@annapurna.org",
                "password": "StrongAdminPassword123!",
            },
        )
        assert boot_res.status_code == 201
        admin_token = boot_res.json()["access_token"]
        admin_id = boot_res.json()["id"]
    else:
        admin_login = client.post(
            "/api/auth/login",
            data={"username": "admin@annapurna.org", "password": "StrongAdminPassword123!"},
        )
        assert admin_login.status_code == 200
        admin_token = admin_login.json()["access_token"]
        admin_id = admin_login.json()["user"]["id"]

    # Second bootstrap attempt must fail with 403
    second_boot = client.post(
        "/api/auth/bootstrap-admin",
        json={
            "full_name": "Another Admin",
            "email": "admin2@annapurna.org",
            "password": "StrongAdminPassword123!",
        },
    )
    assert second_boot.status_code == 403

    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # 3. Admin cannot demote, suspend, or delete themselves / the last active admin
    self_demote = client.patch(
        f"/api/admin/users/{admin_id}/role",
        json={"role": "Donor"},
        headers=admin_headers,
    )
    assert self_demote.status_code == 400

    self_delete = client.delete(
        f"/api/admin/users/{admin_id}",
        headers=admin_headers,
    )
    assert self_delete.status_code == 400

    # 4. Create Donor listing & NGO request, then test Admin moderation and dashboard stats
    listing_res = client.post(
        "/api/listings",
        json={
            "title": "Fresh Sourdough Batch",
            "description": "15 loaves from morning bake",
            "category": "bakery",
            "quantity": "15 loaves",
            "pickup_location": "Main Street Bakery",
        },
        headers={"Authorization": f"Bearer {donor_token}"},
    )
    assert listing_res.status_code == 201
    listing_id = listing_res.json()["id"]

    req_res = client.post(
        "/api/requests",
        json={"listing_id": listing_id, "notes": "Community breakfast program"},
        headers={"Authorization": f"Bearer {ngo_token}"},
    )
    assert req_res.status_code == 201
    req_id = req_res.json()["id"]

    # 5. Admin dashboard stats & activity
    stats = client.get("/api/admin/dashboard/stats", headers=admin_headers)
    assert stats.status_code == 200
    assert stats.json()["total_users"] >= 4
    assert stats.json()["total_listings"] >= 1

    # 6. Admin listing moderation: flag, soft-remove, restore
    flag_res = client.patch(
        f"/api/admin/listings/{listing_id}",
        json={"is_flagged": True, "moderation_notes": "Checking expiry window"},
        headers=admin_headers,
    )
    assert flag_res.status_code == 200
    assert flag_res.json()["is_flagged"] is True

    remove_res = client.delete(
        f"/api/admin/listings/{listing_id}",
        headers=admin_headers,
    )
    assert remove_res.status_code == 200
    assert remove_res.json()["status"] == "removed"

    restore_res = client.post(
        f"/api/admin/listings/{listing_id}/restore",
        headers=admin_headers,
    )
    assert restore_res.status_code == 200
    assert restore_res.json()["status"] == "available"

    # 7. Admin request moderation preserves relationships
    mod_req = client.patch(
        f"/api/admin/requests/{req_id}/moderate",
        json={"is_disputed": True, "moderation_note": "Investigating pickup schedule"},
        headers=admin_headers,
    )
    assert mod_req.status_code == 200
    assert mod_req.json()["is_disputed"] is True
    assert mod_req.json()["listing_id"] == listing_id

    # 8. Database inspection & CSV export never expose password hashes
    db_users = client.get("/api/admin/database/users", headers=admin_headers)
    assert db_users.status_code == 200
    for row in db_users.json()["items"]:
        assert "hashed_password" not in row
        assert "password" not in row

    csv_export = client.get("/api/admin/database/export/users", headers=admin_headers)
    assert csv_export.status_code == 200
    assert "hashed_password" not in csv_export.text

    # 9. Audit logs recorded all administrative actions
    audits = client.get("/api/admin/audit-logs", headers=admin_headers)
    assert audits.status_code == 200
    assert audits.json()["total"] >= 4
