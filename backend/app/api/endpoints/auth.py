"""Compatibility import: Identity now owns its HTTP adapter."""

from app.modules.identity.router import router

__all__ = ["router"]
