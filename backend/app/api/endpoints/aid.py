from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from typing import Any, Dict, List, Optional
from enum import Enum
from datetime import datetime, timezone
from uuid import uuid4

from app.core.authorization import require_role
from app.core.security import require_trusted_origin

router = APIRouter(
    dependencies=[Depends(require_role("admin")), Depends(require_trusted_origin)],
)


# ---------- Enums ----------

class AidCategory(str, Enum):
    disability_support = "disability_support"
    health = "health"
    education = "education"
    financial = "financial"
    housing = "housing"
    other = "other"


class VerificationStatus(str, Enum):
    unverified = "unverified"
    verified = "verified"


class RuleStatus(str, Enum):
    draft = "draft"
    published = "published"
    archived = "archived"


# ---------- Schemas ----------

class AidProgramCreate(BaseModel):
    name: str
    provider: str
    category: AidCategory
    description: str
    jurisdiction: str
    official_url: Optional[str] = None
    is_active: bool = True


class AidProgramUpdate(BaseModel):
    name: Optional[str] = None
    provider: Optional[str] = None
    category: Optional[AidCategory] = None
    description: Optional[str] = None
    jurisdiction: Optional[str] = None
    official_url: Optional[str] = None
    is_active: Optional[bool] = None


class AidProgram(BaseModel):
    id: str
    name: str
    provider: str
    category: AidCategory
    description: str
    jurisdiction: str
    official_url: Optional[str] = None
    verification_status: VerificationStatus = VerificationStatus.unverified
    is_active: bool
    current_rule_version: Optional[int] = None
    created_at: datetime
    updated_at: datetime


class AidRuleVersionCreate(BaseModel):
    rule_json: Dict[str, Any]
    human_summary: str


class AidRuleVersion(BaseModel):
    id: str
    program_id: str
    version: int
    rule_json: Dict[str, Any]
    human_summary: str
    status: RuleStatus
    published_at: Optional[datetime] = None
    created_at: datetime


# ---------- In-memory storage ----------

_now = datetime.now(timezone.utc)

db_programs: Dict[str, dict] = {}
db_rules: Dict[str, dict] = {}  # keyed by rule id

# Seed data
_seeds = [
    {
        "id": "seed-prog-1",
        "name": "Program Jaminan Kesehatan Nasional (JKN)",
        "provider": "BPJS Kesehatan",
        "category": AidCategory.health,
        "description": "National health insurance program providing coverage for Indonesian citizens.",
        "jurisdiction": "Nasional",
        "official_url": "https://bpjs-kesehatan.go.id",
        "verification_status": VerificationStatus.verified,
        "is_active": True,
        "current_rule_version": 1,
        "created_at": _now,
        "updated_at": _now,
    },
    {
        "id": "seed-prog-2",
        "name": "Program Keluarga Harapan (PKH)",
        "provider": "Kementerian Sosial",
        "category": AidCategory.financial,
        "description": "Conditional cash transfer for very poor families to improve health and education outcomes.",
        "jurisdiction": "Nasional",
        "official_url": "https://pkh.kemensos.go.id",
        "verification_status": VerificationStatus.verified,
        "is_active": True,
        "current_rule_version": 1,
        "created_at": _now,
        "updated_at": _now,
    },
    {
        "id": "seed-prog-3",
        "name": "Bantuan Penyandang Disabilitas Berat",
        "provider": "Kementerian Sosial",
        "category": AidCategory.disability_support,
        "description": "Monthly assistance for individuals with severe disabilities who cannot perform daily activities independently.",
        "jurisdiction": "Nasional",
        "official_url": None,
        "verification_status": VerificationStatus.unverified,
        "is_active": True,
        "current_rule_version": 1,
        "created_at": _now,
        "updated_at": _now,
    },
]

_seed_rules = [
    {
        "id": "seed-rule-1",
        "program_id": "seed-prog-1",
        "version": 1,
        "rule_json": {
            "operator": "AND",
            "conditions": [
                {"field": "nationality", "op": "eq", "value": "ID"},
                {"field": "has_ktp", "op": "eq", "value": True},
            ],
        },
        "human_summary": "Warga Negara Indonesia yang memiliki KTP.",
        "status": RuleStatus.published,
        "published_at": _now,
        "created_at": _now,
    },
    {
        "id": "seed-rule-2",
        "program_id": "seed-prog-2",
        "version": 1,
        "rule_json": {
            "operator": "AND",
            "conditions": [
                {"field": "income_monthly_idr", "op": "lte", "value": 1_500_000},
                {"field": "has_children_under_18", "op": "eq", "value": True},
                {"field": "registered_dtks", "op": "eq", "value": True},
            ],
        },
        "human_summary": "Keluarga miskin terdaftar DTKS dengan anak di bawah 18 tahun dan penghasilan ≤ Rp1.500.000/bulan.",
        "status": RuleStatus.published,
        "published_at": _now,
        "created_at": _now,
    },
    {
        "id": "seed-rule-3",
        "program_id": "seed-prog-3",
        "version": 1,
        "rule_json": {
            "operator": "AND",
            "conditions": [
                {"field": "disability_level", "op": "eq", "value": "berat"},
                {"field": "has_disability_certificate", "op": "eq", "value": True},
                {"field": "income_monthly_idr", "op": "lte", "value": 1_000_000},
            ],
        },
        "human_summary": "Penyandang disabilitas berat dengan surat keterangan dokter dan penghasilan ≤ Rp1.000.000/bulan.",
        "status": RuleStatus.published,
        "published_at": _now,
        "created_at": _now,
    },
]

for p in _seeds:
    db_programs[p["id"]] = p
for r in _seed_rules:
    db_rules[r["id"]] = r


# ---------- Helpers ----------

def _get_program_or_404(program_id: str) -> dict:
    prog = db_programs.get(program_id)
    if not prog:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail=f"Program {program_id} not found")
    return prog


def _next_version(program_id: str) -> int:
    versions = [r["version"] for r in db_rules.values() if r["program_id"] == program_id]
    return max(versions, default=0) + 1


# ---------- Program endpoints ----------

@router.get("", response_model=List[AidProgram])
def list_programs(is_active: Optional[bool] = Query(None)):
    """List all aid programs, optionally filtered by active status."""
    programs = list(db_programs.values())
    if is_active is not None:
        programs = [p for p in programs if p["is_active"] == is_active]
    return programs


@router.post("", response_model=AidProgram, status_code=status.HTTP_201_CREATED)
def create_program(body: AidProgramCreate):
    """Create a new aid program."""
    now = datetime.now(timezone.utc)
    program = {
        "id": str(uuid4())[:8],
        "name": body.name,
        "provider": body.provider,
        "category": body.category,
        "description": body.description,
        "jurisdiction": body.jurisdiction,
        "official_url": body.official_url,
        "verification_status": VerificationStatus.unverified,
        "is_active": body.is_active,
        "current_rule_version": None,
        "created_at": now,
        "updated_at": now,
    }
    db_programs[program["id"]] = program
    return program


@router.get("/{program_id}", response_model=AidProgram)
def get_program(program_id: str):
    """Get a single aid program by ID."""
    return _get_program_or_404(program_id)


@router.patch("/{program_id}", response_model=AidProgram)
def update_program(program_id: str, body: AidProgramUpdate):
    """Partially update an aid program."""
    program = _get_program_or_404(program_id)
    updates = body.model_dump(exclude_unset=True)
    program.update(updates)
    program["updated_at"] = datetime.now(timezone.utc)
    return program


@router.delete("/{program_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_program(program_id: str):
    """Delete an aid program and its rule versions."""
    _get_program_or_404(program_id)
    del db_programs[program_id]
    # ponytail: cascade-delete rules in-memory, good enough for now
    rule_ids = [rid for rid, r in db_rules.items() if r["program_id"] == program_id]
    for rid in rule_ids:
        del db_rules[rid]
    return None


# ---------- Rule version endpoints ----------

@router.get("/{program_id}/rules", response_model=List[AidRuleVersion])
def list_rules(program_id: str):
    """List all rule versions for a program."""
    _get_program_or_404(program_id)
    return [r for r in db_rules.values() if r["program_id"] == program_id]


@router.post("/{program_id}/rules", response_model=AidRuleVersion, status_code=status.HTTP_201_CREATED)
def create_rule(program_id: str, body: AidRuleVersionCreate):
    """Create a new draft rule version for a program."""
    _get_program_or_404(program_id)
    rule = {
        "id": str(uuid4())[:8],
        "program_id": program_id,
        "version": _next_version(program_id),
        "rule_json": body.rule_json,
        "human_summary": body.human_summary,
        "status": RuleStatus.draft,
        "published_at": None,
        "created_at": datetime.now(timezone.utc),
    }
    db_rules[rule["id"]] = rule
    return rule


@router.patch("/{program_id}/rules/{rule_id}/publish", response_model=AidRuleVersion)
def publish_rule(program_id: str, rule_id: str):
    """Publish a rule version — archives any previously published version."""
    program = _get_program_or_404(program_id)
    rule = db_rules.get(rule_id)
    if not rule or rule["program_id"] != program_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail=f"Rule {rule_id} not found for program {program_id}")
    if rule["status"] == RuleStatus.published:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="Rule is already published")

    # Archive old published version
    for r in db_rules.values():
        if r["program_id"] == program_id and r["status"] == RuleStatus.published:
            r["status"] = RuleStatus.archived

    now = datetime.now(timezone.utc)
    rule["status"] = RuleStatus.published
    rule["published_at"] = now
    program["current_rule_version"] = rule["version"]
    program["updated_at"] = now
    return rule
