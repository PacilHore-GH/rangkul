import pytest
from fastapi.testclient import TestClient

from app.core.config import settings
from app.main import app

client = TestClient(app)
ADMIN_HEADERS = {"Authorization": "Bearer test-facility-admin"}


@pytest.fixture(autouse=True)
def configure_admin_token(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(settings, "FACILITY_ADMIN_TOKEN", "test-facility-admin")


def test_admin_is_disabled_without_bootstrap_token(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(settings, "FACILITY_ADMIN_TOKEN", None)

    response = client.get("/api/v1/admin/facilities", headers=ADMIN_HEADERS)

    assert response.status_code == 503


def test_admin_rejects_missing_credentials() -> None:
    response = client.get("/api/v1/admin/facilities")

    assert response.status_code == 401


def test_admin_can_list_catalog_and_correction_reports() -> None:
    client.post(
        "/api/v1/facilities/fcl_jakarta_01/report",
        json={"reason": "contact", "details": "Kontak fasilitas perlu diperiksa ulang."},
    )

    catalog = client.get("/api/v1/admin/facilities", headers=ADMIN_HEADERS)
    reports = client.get("/api/v1/admin/facilities/reports", headers=ADMIN_HEADERS)

    assert catalog.status_code == 200
    assert len(catalog.json()) >= 5
    assert reports.status_code == 200
    assert reports.json()[-1]["facility_id"] == "fcl_jakarta_01"
