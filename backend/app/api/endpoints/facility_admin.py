import secrets
import uuid
from datetime import UTC, date, datetime
from typing import Annotated, Literal

from fastapi import APIRouter, Depends, Header, HTTPException
from pydantic import AnyHttpUrl, BaseModel, Field, model_validator

from app.api.endpoints.facilities import (
    FACILITIES,
    FACILITY_REPORTS,
    Category,
    Facility,
    FacilityReport,
    FacilityService,
)
from app.core.config import settings

router = APIRouter()


class FacilityInput(BaseModel):
    name: str = Field(min_length=2, max_length=200)
    category: Category
    description: str = Field(min_length=10, max_length=2000)
    address: str = Field(min_length=5, max_length=500)
    city: str = Field(min_length=2, max_length=100)
    province: str = Field(min_length=2, max_length=100)
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)
    phone: str | None = Field(default=None, max_length=50)
    website: AnyHttpUrl | None = None
    verification_status: Literal["verified", "unverified", "needs_review"]
    source_name: str = Field(min_length=2, max_length=200)
    source_url: AnyHttpUrl | None = None
    source_updated_at: date
    valid_until: date
    services: list[FacilityService] = Field(min_length=1, max_length=50)
    active: bool = True

    @model_validator(mode="after")
    def validate_validity_window(self) -> "FacilityInput":
        if self.valid_until < self.source_updated_at:
            raise ValueError("Masa berlaku tidak boleh sebelum tanggal pembaruan sumber.")
        return self


class FacilityStatusUpdate(BaseModel):
    active: bool


class FacilityReportUpdate(BaseModel):
    status: Literal["reviewing", "resolved", "dismissed"]
    resolution_note: str | None = Field(default=None, max_length=1000)

    @model_validator(mode="after")
    def require_resolution_note(self) -> "FacilityReportUpdate":
        if self.status in {"resolved", "dismissed"} and not (self.resolution_note or "").strip():
            raise ValueError("Catatan wajib diisi saat laporan ditutup.")
        return self


def require_facility_admin(
    authorization: Annotated[str | None, Header()] = None,
) -> None:
    """Bootstrap guard; replace with the shared Admin-role dependency after auth merges."""
    expected = settings.FACILITY_ADMIN_TOKEN
    if not expected:
        raise HTTPException(status_code=503, detail="Facility admin belum dikonfigurasi.")
    scheme, _, credential = (authorization or "").partition(" ")
    if scheme.casefold() != "bearer" or not secrets.compare_digest(credential, expected):
        raise HTTPException(status_code=401, detail="Kredensial admin tidak valid.")


@router.get("", response_model=list[Facility])
def list_admin_facilities(_: None = Depends(require_facility_admin)) -> list[Facility]:
    facilities = [item.model_copy(deep=True) for item in FACILITIES]
    for facility in facilities:
        facility.stale = facility.valid_until < date.today()
    return facilities


@router.get("/reports", response_model=list[FacilityReport])
def list_facility_reports(_: None = Depends(require_facility_admin)) -> list[FacilityReport]:
    return list(FACILITY_REPORTS)


@router.post("", response_model=Facility, status_code=201)
def create_facility(
    payload: FacilityInput,
    _: None = Depends(require_facility_admin),
) -> Facility:
    facility = Facility(
        id=f"fcl_{uuid.uuid4().hex[:12]}",
        **payload.model_dump(mode="json"),
    )
    FACILITIES.append(facility)
    return facility


@router.put("/{facility_id}", response_model=Facility)
def replace_facility(
    facility_id: str,
    payload: FacilityInput,
    _: None = Depends(require_facility_admin),
) -> Facility:
    for index, stored in enumerate(FACILITIES):
        if stored.id == facility_id:
            facility = Facility(id=facility_id, **payload.model_dump(mode="json"))
            FACILITIES[index] = facility
            return facility
    raise HTTPException(status_code=404, detail="Fasilitas tidak ditemukan.")


@router.patch("/{facility_id}/status", response_model=Facility)
def update_facility_status(
    facility_id: str,
    payload: FacilityStatusUpdate,
    _: None = Depends(require_facility_admin),
) -> Facility:
    facility = next((item for item in FACILITIES if item.id == facility_id), None)
    if not facility:
        raise HTTPException(status_code=404, detail="Fasilitas tidak ditemukan.")
    facility.active = payload.active
    return facility


@router.patch("/reports/{report_id}", response_model=FacilityReport)
def update_facility_report(
    report_id: str,
    payload: FacilityReportUpdate,
    _: None = Depends(require_facility_admin),
) -> FacilityReport:
    report = next((item for item in FACILITY_REPORTS if item.id == report_id), None)
    if not report:
        raise HTTPException(status_code=404, detail="Laporan tidak ditemukan.")
    report.status = payload.status
    report.resolution_note = payload.resolution_note
    report.updated_at = datetime.now(UTC)
    return report
