"""Feature modules for the Rangkul modular monolith.

Each module owns its HTTP router, application services and schemas. Modules may
depend on core infrastructure, but must not import another module's router.
"""
