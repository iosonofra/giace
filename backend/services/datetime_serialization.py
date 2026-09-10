"""Consistent serialization for UTC instants stored without timezone metadata.

SQLite ``CURRENT_TIMESTAMP`` and the application services store operational
timestamps as naive UTC values.  API responses must add that missing context,
otherwise browsers interpret those values as local time and display them one
or two hours behind in Europe/Rome.
"""

from datetime import datetime, timezone


def utc_iso(value: datetime | None) -> str | None:
    """Return an RFC 3339 UTC timestamp, using ``Z`` as the UTC designator."""
    if value is None:
        return None
    if value.tzinfo is None:
        value = value.replace(tzinfo=timezone.utc)
    else:
        value = value.astimezone(timezone.utc)
    return value.isoformat().replace("+00:00", "Z")
