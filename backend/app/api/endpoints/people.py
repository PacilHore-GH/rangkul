"""Compatibility import: People now owns its HTTP adapter."""

from app.modules.people.router import router

__all__ = ["router"]
