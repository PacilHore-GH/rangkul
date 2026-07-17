from datetime import datetime

from pydantic import BaseModel, Field, HttpUrl, field_validator, model_validator

from app.core.schemas import StrictInputModel
from app.core.text import sanitize_multiline, sanitize_single_line

FACILITY_TYPES = {"hospital", "clinic", "therapy_center", "school", "community_service"}


def clean_line(value: str, limit: int, label: str) -> str:
    value = sanitize_single_line(value, limit + 1)
    if not value or len(value) > limit:
        raise ValueError(f"{label} harus berisi 1-{limit} karakter.")
    return value


def clean_services(values: list[str]) -> list[str]:
    result = [clean_line(value, 80, "Layanan") for value in values]
    if len(result) != len(set(result)):
        raise ValueError("Layanan tidak boleh duplikat.")
    return result


class FacilityCreateInput(StrictInputModel):
    name: str
    facility_type: str
    description: str | None = Field(default=None, max_length=2000)
    services: list[str] = Field(default_factory=list, max_length=20)
    address: str
    city: str
    province: str
    latitude: float | None = Field(default=None, ge=-90, le=90)
    longitude: float | None = Field(default=None, ge=-180, le=180)
    phone: str | None = Field(default=None, max_length=30)
    website: HttpUrl | None = None
    source_name: str
    source_url: HttpUrl
    is_active: bool = True

    @field_validator("name")
    @classmethod
    def validate_name(cls, value: str) -> str:
        return clean_line(value, 120, "Nama")

    @field_validator("facility_type")
    @classmethod
    def validate_type(cls, value: str) -> str:
        if value not in FACILITY_TYPES:
            raise ValueError("Tipe fasilitas tidak valid.")
        return value

    @field_validator("description")
    @classmethod
    def validate_description(cls, value: str | None) -> str | None:
        return sanitize_multiline(value, 2000) or None if value else None

    @field_validator("services")
    @classmethod
    def validate_services(cls, values: list[str]) -> list[str]:
        return clean_services(values)

    @field_validator("address")
    @classmethod
    def validate_address(cls, value: str) -> str:
        return clean_line(value, 300, "Alamat")

    @field_validator("city", "province")
    @classmethod
    def validate_region(cls, value: str) -> str:
        return clean_line(value, 80, "Wilayah")

    @field_validator("source_name")
    @classmethod
    def validate_source_name(cls, value: str) -> str:
        return clean_line(value, 120, "Nama sumber")

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, value: str | None) -> str | None:
        return sanitize_single_line(value, 30) or None if value else None

    @model_validator(mode="after")
    def coordinates_are_a_pair(self):
        if (self.latitude is None) != (self.longitude is None):
            raise ValueError("Latitude dan longitude harus diisi berpasangan.")
        return self


class FacilityUpdateInput(StrictInputModel):
    name: str | None = None
    facility_type: str | None = None
    description: str | None = Field(default=None, max_length=2000)
    services: list[str] | None = Field(default=None, max_length=20)
    address: str | None = None
    city: str | None = None
    province: str | None = None
    latitude: float | None = Field(default=None, ge=-90, le=90)
    longitude: float | None = Field(default=None, ge=-180, le=180)
    phone: str | None = Field(default=None, max_length=30)
    website: HttpUrl | None = None
    source_name: str | None = None
    source_url: HttpUrl | None = None
    is_active: bool | None = None

    @field_validator("name")
    @classmethod
    def validate_name(cls, value: str | None) -> str | None:
        return clean_line(value, 120, "Nama") if value is not None else value

    @field_validator("facility_type")
    @classmethod
    def validate_type(cls, value: str | None) -> str | None:
        if value is not None and value not in FACILITY_TYPES:
            raise ValueError("Tipe fasilitas tidak valid.")
        return value

    @field_validator("description")
    @classmethod
    def validate_description(cls, value: str | None) -> str | None:
        return sanitize_multiline(value, 2000) or None if value else None

    @field_validator("services")
    @classmethod
    def validate_services(cls, values: list[str] | None) -> list[str] | None:
        return clean_services(values) if values is not None else values

    @field_validator("address")
    @classmethod
    def validate_address(cls, value: str | None) -> str | None:
        return clean_line(value, 300, "Alamat") if value is not None else value

    @field_validator("city", "province")
    @classmethod
    def validate_region(cls, value: str | None) -> str | None:
        return clean_line(value, 80, "Wilayah") if value is not None else value

    @field_validator("source_name")
    @classmethod
    def validate_source_name(cls, value: str | None) -> str | None:
        return clean_line(value, 120, "Nama sumber") if value is not None else value

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, value: str | None) -> str | None:
        return sanitize_single_line(value, 30) or None if value else None


class FacilityOutput(BaseModel):
    id: str
    name: str
    facility_type: str
    description: str | None
    services: list[str]
    address: str
    city: str
    province: str
    latitude: float | None
    longitude: float | None
    phone: str | None
    website: str | None
    source_name: str
    source_url: str
    is_active: bool
    created_at: datetime
    updated_at: datetime
    model_config = {"from_attributes": True}
