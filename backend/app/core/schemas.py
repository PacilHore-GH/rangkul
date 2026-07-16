"""Shared strict request schema."""

from pydantic import BaseModel, ConfigDict


class StrictInputModel(BaseModel):
    model_config = ConfigDict(extra="forbid")
