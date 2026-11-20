"""Shared objects created at startup (see main.py lifespan). Routers read them from here."""
from types import SimpleNamespace

ctx = SimpleNamespace(index=None, state=None)
