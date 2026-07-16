import secrets
from datetime import date
from typing import Annotated

from fastapi import APIRouter, Depends, Header, HTTPException

from app.api.endpoints.facilities import FACILITIES, FACILITY_REPORTS, Facility, FacilityReport
from app.core.config import settings

router = APIRouter()


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
