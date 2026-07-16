import pytest
from fastapi.testclient import TestClient

from app.api.endpoints.facilities import FACILITIES, FACILITY_REPORTS
from app.core.config import settings
from app.main import app

client = TestClient(app)
ADMIN_HEADERS = {"Authorization": "Bearer test-facility-admin"}


@pytest.fixture(autouse=True)
def configure_admin_token(monkeypatch: pytest.MonkeyPatch):
    facilities = [item.model_copy(deep=True) for item in FACILITIES]
    reports = [item.model_copy(deep=True) for item in FACILITY_REPORTS]
    monkeypatch.setattr(settings, "FACILITY_ADMIN_TOKEN", "test-facility-admin")
    yield
    FACILITIES[:] = facilities
    FACILITY_REPORTS[:] = reports


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


def facility_payload() -> dict:
    return {
        "name": "Klinik Terverifikasi Contoh",
        "category": "clinic",
        "description": "Klinik contoh untuk menguji pengelolaan katalog fasilitas.",
        "address": "Jl. Pengujian No. 1",
        "city": "Bogor",
        "province": "Jawa Barat",
        "latitude": -6.5971,
        "longitude": 106.806,
        "phone": "0251-555-0101",
        "website": "https://example.org/klinik",
        "verification_status": "verified",
        "source_name": "Sumber resmi contoh",
        "source_url": "https://example.org/sumber",
        "source_updated_at": "2026-07-01",
        "valid_until": "2027-07-01",
        "services": [
            {
                "code": "physiotherapy",
                "name": "Fisioterapi",
                "accepts_bpjs": True,
            }
        ],
        "active": True,
    }


def test_admin_can_create_and_replace_facility() -> None:
    created = client.post(
        "/api/v1/admin/facilities",
        headers=ADMIN_HEADERS,
        json=facility_payload(),
    )
    facility_id = created.json()["id"]
    replacement = facility_payload() | {"name": "Klinik Contoh Diperbarui"}

    updated = client.put(
        f"/api/v1/admin/facilities/{facility_id}",
        headers=ADMIN_HEADERS,
        json=replacement,
    )
    public_detail = client.get(f"/api/v1/facilities/{facility_id}")

    assert created.status_code == 201
    assert updated.status_code == 200
    assert public_detail.json()["name"] == "Klinik Contoh Diperbarui"


def test_admin_can_hide_facility_from_public_catalog() -> None:
    response = client.patch(
        "/api/v1/admin/facilities/fcl_jakarta_01/status",
        headers=ADMIN_HEADERS,
        json={"active": False},
    )

    assert response.status_code == 200
    assert response.json()["active"] is False
    assert client.get("/api/v1/facilities/fcl_jakarta_01").status_code == 404


def test_closed_report_requires_note_and_can_be_resolved() -> None:
    report = client.post(
        "/api/v1/facilities/fcl_jakarta_01/report",
        json={"reason": "contact", "details": "Nomor telepon tidak lagi dapat dihubungi."},
    ).json()

    invalid = client.patch(
        f"/api/v1/admin/facilities/reports/{report['id']}",
        headers=ADMIN_HEADERS,
        json={"status": "resolved"},
    )
    resolved = client.patch(
        f"/api/v1/admin/facilities/reports/{report['id']}",
        headers=ADMIN_HEADERS,
        json={"status": "resolved", "resolution_note": "Kontak telah diperbarui."},
    )

    assert invalid.status_code == 422
    assert resolved.status_code == 200
    assert resolved.json()["status"] == "resolved"
