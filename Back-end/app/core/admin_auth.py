import base64
import hashlib
import hmac
import json
import time

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from app.core.config import settings

security = HTTPBearer(auto_error=False)


def create_admin_token() -> str:
    if not settings.admin_credentials_configured:
        raise RuntimeError("Admin authentication is not configured")
    payload = base64.urlsafe_b64encode(json.dumps({"sub": settings.admin_email, "exp": int(time.time()) + settings.admin_token_ttl_seconds}).encode()).decode().rstrip("=")
    signature = hmac.new(settings.admin_token_secret.encode(), payload.encode(), hashlib.sha256).hexdigest()
    return f"{payload}.{signature}"


def require_admin(credentials: HTTPAuthorizationCredentials | None = Depends(security)) -> str:
    if not settings.admin_credentials_configured:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Admin authentication is not configured")
    if not credentials or credentials.scheme.lower() != "bearer":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required")
    try:
        payload, signature = credentials.credentials.split(".", 1)
        expected = hmac.new(settings.admin_token_secret.encode(), payload.encode(), hashlib.sha256).hexdigest()
        decoded = json.loads(base64.urlsafe_b64decode(payload + "=" * (-len(payload) % 4)))
        valid = hmac.compare_digest(signature, expected) and decoded["sub"] == settings.admin_email and decoded["exp"] > time.time()
    except (ValueError, KeyError, TypeError, json.JSONDecodeError):
        valid = False
    if not valid:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")
    return settings.admin_email
