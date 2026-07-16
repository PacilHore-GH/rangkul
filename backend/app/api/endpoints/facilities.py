import base64
import binascii
import math
import uuid
from datetime import UTC, date, datetime
from typing import Literal

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field, field_validator

router = APIRouter()

Category = Literal["hospital", "clinic", "therapy_center", "inclusive_school"]
Sort = Literal["relevance", "name", "distance", "freshness"]
Accessibility = Literal[
    "wheelchair_access",
    "accessible_toilet",
    "sign_language",
    "sensory_friendly",
]


class FacilityService(BaseModel):
    code: str
    name: str
    age_min: int = 0
    age_max: int | None = None
    accepts_bpjs: bool = False
    online_booking: bool = False
    accessibility: list[Accessibility] = Field(default_factory=list)


class Facility(BaseModel):
    id: str
    name: str
    category: Category
    description: str
    address: str
    city: str
    province: str
    latitude: float
    longitude: float
    phone: str | None = None
    website: str | None = None
    verification_status: Literal["verified", "unverified", "needs_review"]
    source_name: str
    source_url: str | None = None
    source_updated_at: date
    valid_until: date
    services: list[FacilityService]
    stale: bool = False
    distance_km: float | None = None


class FacilityList(BaseModel):
    items: list[Facility]
    next_cursor: str | None


class FacilityCompare(BaseModel):
    facility_ids: list[str] = Field(min_length=2, max_length=4)

    @field_validator("facility_ids")
    @classmethod
    def require_unique_facilities(cls, value: list[str]) -> list[str]:
        if len(set(value)) != len(value):
            raise ValueError("Fasilitas yang dibandingkan harus unik.")
        return value


class FacilityReportCreate(BaseModel):
    reason: Literal["wrong_information", "closed", "contact", "service", "other"]
    details: str = Field(min_length=10, max_length=1000)


class FacilityReport(BaseModel):
    id: str
    facility_id: str
    reason: Literal["wrong_information", "closed", "contact", "service", "other"]
    details: str
    status: Literal["received"] = "received"
    created_at: datetime


# ponytail: demo catalog until the shared PostgreSQL foundation lands; replace
# this list with a repository after the auth/database branch is merged.
FACILITIES = [
    Facility(
        id="fcl_jakarta_01",
        name="Pusat Tumbuh Kembang Rangkul Jakarta",
        category="therapy_center",
        description="Data demonstrasi pusat terapi anak multidisiplin.",
        address="Jl. Contoh No. 10, Jakarta Pusat",
        city="Jakarta Pusat",
        province="DKI Jakarta",
        latitude=-6.1862,
        longitude=106.8341,
        phone="(021) 555-0101",
        verification_status="unverified",
        source_name="Dataset demonstrasi Rangkul",
        source_updated_at=date(2026, 7, 16),
        valid_until=date(2099, 12, 31),
        services=[
            FacilityService(
                code="occupational_therapy",
                name="Terapi Okupasi",
                age_max=18,
                accepts_bpjs=True,
                online_booking=True,
                accessibility=["wheelchair_access", "sensory_friendly"],
            ),
            FacilityService(
                code="speech_therapy",
                name="Terapi Wicara",
                age_max=18,
                online_booking=True,
                accessibility=["sensory_friendly"],
            ),
        ],
    ),
    Facility(
        id="fcl_bandung_01",
        name="Klinik Cakrawala Bandung",
        category="clinic",
        description="Data demonstrasi klinik rehabilitasi dan fisioterapi.",
        address="Jl. Ilustrasi No. 21, Kota Bandung",
        city="Bandung",
        province="Jawa Barat",
        latitude=-6.9175,
        longitude=107.6191,
        verification_status="unverified",
        source_name="Dataset demonstrasi Rangkul",
        source_updated_at=date(2026, 7, 16),
        valid_until=date(2099, 12, 31),
        services=[
            FacilityService(
                code="physiotherapy",
                name="Fisioterapi",
                accepts_bpjs=True,
                accessibility=["wheelchair_access", "accessible_toilet"],
            )
        ],
    ),
    Facility(
        id="fcl_surabaya_01",
        name="RS Pendidikan Nusantara Surabaya",
        category="hospital",
        description="Data demonstrasi rumah sakit dengan layanan rehabilitasi medik.",
        address="Jl. Sampel No. 8, Surabaya",
        city="Surabaya",
        province="Jawa Timur",
        latitude=-7.2575,
        longitude=112.7521,
        verification_status="unverified",
        source_name="Dataset demonstrasi Rangkul",
        source_updated_at=date(2026, 7, 16),
        valid_until=date(2099, 12, 31),
        services=[
            FacilityService(
                code="medical_rehabilitation",
                name="Rehabilitasi Medik",
                accepts_bpjs=True,
                accessibility=["wheelchair_access", "accessible_toilet"],
            ),
            FacilityService(
                code="child_psychology",
                name="Psikologi Anak",
                online_booking=True,
            ),
        ],
    ),
    Facility(
        id="fcl_denpasar_01",
        name="Pusat Dukungan Sensorik Denpasar",
        category="therapy_center",
        description="Data demonstrasi layanan integrasi sensorik dan terapi perilaku.",
        address="Jl. Purwarupa No. 4, Denpasar",
        city="Denpasar",
        province="Bali",
        latitude=-8.6705,
        longitude=115.2126,
        verification_status="needs_review",
        source_name="Dataset demonstrasi Rangkul",
        source_updated_at=date(2020, 1, 1),
        valid_until=date(2020, 12, 31),
        services=[
            FacilityService(
                code="sensory_integration",
                name="Integrasi Sensorik",
                age_max=17,
                accessibility=["sensory_friendly"],
            )
        ],
    ),
    Facility(
        id="fcl_makassar_01",
        name="Sekolah Inklusif Harapan Makassar",
        category="inclusive_school",
        description="Data demonstrasi sekolah dengan program pendampingan inklusif.",
        address="Jl. Prototipe No. 15, Makassar",
        city="Makassar",
        province="Sulawesi Selatan",
        latitude=-5.1477,
        longitude=119.4327,
        verification_status="unverified",
        source_name="Dataset demonstrasi Rangkul",
        source_updated_at=date(2026, 7, 16),
        valid_until=date(2099, 12, 31),
        services=[
            FacilityService(
                code="inclusive_education",
                name="Pendidikan Inklusif",
                age_min=6,
                age_max=18,
                accessibility=["wheelchair_access", "sensory_friendly"],
            )
        ],
    ),
]

FACILITY_REPORTS: list[FacilityReport] = []


def _distance_km(lat: float, lng: float, facility: Facility) -> float:
    lat1, lat2 = math.radians(lat), math.radians(facility.latitude)
    dlat = lat2 - lat1
    dlng = math.radians(facility.longitude - lng)
    a = math.sin(dlat / 2) ** 2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlng / 2) ** 2
    return round(6371 * 2 * math.asin(math.sqrt(a)), 1)


def _cursor_offset(cursor: str | None) -> int:
    if not cursor:
        return 0
    try:
        offset = int(base64.urlsafe_b64decode(cursor + "===").decode())
        if offset < 0:
            raise ValueError
        return offset
    except (binascii.Error, ValueError, UnicodeDecodeError):
        raise HTTPException(status_code=422, detail="Cursor tidak valid.") from None


def _encode_cursor(offset: int) -> str:
    return base64.urlsafe_b64encode(str(offset).encode()).decode().rstrip("=")


@router.get("", response_model=FacilityList)
def search_facilities(
    q: str | None = Query(default=None, max_length=100),
    category: Category | None = None,
    region: str | None = Query(default=None, max_length=100),
    service: str | None = Query(default=None, max_length=100),
    age: int | None = Query(default=None, ge=0, le=120),
    accepts_bpjs: bool | None = None,
    online_booking: bool | None = None,
    accessibility: Accessibility | None = None,
    latitude: float | None = Query(default=None, ge=-90, le=90),
    longitude: float | None = Query(default=None, ge=-180, le=180),
    radius_km: float = Query(default=25, gt=0, le=100),
    sort: Sort = "relevance",
    cursor: str | None = None,
    limit: int = Query(default=12, ge=1, le=50),
) -> FacilityList:
    if (latitude is None) != (longitude is None):
        raise HTTPException(status_code=422, detail="Latitude dan longitude harus diisi bersama.")
    if sort == "distance" and latitude is None:
        raise HTTPException(status_code=422, detail="Lokasi diperlukan untuk mengurutkan jarak.")

    query = (q or "").strip().casefold()
    region_query = (region or "").strip().casefold()
    service_query = (service or "").strip().casefold()
    results: list[Facility] = []

    for stored in FACILITIES:
        facility = stored.model_copy(deep=True)
        facility.stale = facility.valid_until < date.today()
        searchable = " ".join(
            [facility.name, facility.description, facility.address, *(item.name for item in facility.services)]
        ).casefold()
        if query and query not in searchable:
            continue
        if category and facility.category != category:
            continue
        if region_query and region_query not in f"{facility.city} {facility.province}".casefold():
            continue

        services = [
            item
            for item in facility.services
            if (not service_query or service_query in f"{item.code} {item.name}".casefold())
            and (age is None or (item.age_min <= age and (item.age_max is None or item.age_max >= age)))
            and (accepts_bpjs is None or item.accepts_bpjs == accepts_bpjs)
            and (online_booking is None or item.online_booking == online_booking)
            and (accessibility is None or accessibility in item.accessibility)
        ]
        if any(value is not None for value in (service, age, accepts_bpjs, online_booking, accessibility)) and not services:
            continue

        if latitude is not None and longitude is not None:
            facility.distance_km = _distance_km(latitude, longitude, facility)
            if facility.distance_km > radius_km:
                continue
        results.append(facility)

    if sort == "name":
        results.sort(key=lambda item: item.name.casefold())
    elif sort == "distance":
        results.sort(key=lambda item: item.distance_km or 0)
    elif sort == "freshness":
        results.sort(key=lambda item: item.source_updated_at, reverse=True)

    offset = _cursor_offset(cursor)
    page = results[offset : offset + limit]
    next_offset = offset + limit
    return FacilityList(
        items=page,
        next_cursor=_encode_cursor(next_offset) if next_offset < len(results) else None,
    )


@router.post("/compare", response_model=list[Facility])
def compare_facilities(payload: FacilityCompare) -> list[Facility]:
    facilities_by_id = {item.id: item for item in FACILITIES}
    missing = [item_id for item_id in payload.facility_ids if item_id not in facilities_by_id]
    if missing:
        raise HTTPException(status_code=404, detail="Satu atau beberapa fasilitas tidak ditemukan.")

    result = [facilities_by_id[item_id].model_copy(deep=True) for item_id in payload.facility_ids]
    for facility in result:
        facility.stale = facility.valid_until < date.today()
    return result


@router.post("/{facility_id}/report", response_model=FacilityReport, status_code=201)
def report_facility(facility_id: str, payload: FacilityReportCreate) -> FacilityReport:
    if not any(item.id == facility_id for item in FACILITIES):
        raise HTTPException(status_code=404, detail="Fasilitas tidak ditemukan.")

    report = FacilityReport(
        id=f"frp_{uuid.uuid4().hex[:12]}",
        facility_id=facility_id,
        reason=payload.reason,
        details=payload.details,
        created_at=datetime.now(UTC),
    )
    FACILITY_REPORTS.append(report)
    return report


@router.get("/{facility_id}", response_model=Facility)
def get_facility(facility_id: str) -> Facility:
    facility = next((item.model_copy(deep=True) for item in FACILITIES if item.id == facility_id), None)
    if not facility:
        raise HTTPException(status_code=404, detail="Fasilitas tidak ditemukan.")
    facility.stale = facility.valid_until < date.today()
    return facility
