import base64
import hashlib
import hmac
import json
import time
import unittest
from datetime import datetime, timedelta, timezone

from fastapi import HTTPException
from fastapi.security import HTTPAuthorizationCredentials
from fastapi.testclient import TestClient

from app.core.admin_auth import create_admin_token, require_admin
from app.core.config import settings
from app.core.rate_limit import limiter
from app.main import app
from app.routers.admin import _customer_row, _date, _trend


class AdminBackendTests(unittest.TestCase):
    def setUp(self):
        limiter.reset()
        self.original = (settings.admin_email, settings.admin_password, settings.admin_token_secret, settings.admin_token_ttl_seconds, settings.business_timezone)
        settings.admin_email = "owner@example.com"
        settings.admin_password = "a-secure-test-password"
        settings.admin_token_secret = "test-secret-that-is-longer-than-32-characters"
        settings.admin_token_ttl_seconds = 3600

    def tearDown(self):
        settings.admin_email, settings.admin_password, settings.admin_token_secret, settings.admin_token_ttl_seconds, settings.business_timezone = self.original

    def test_token_round_trip(self):
        token = create_admin_token()
        credentials = HTTPAuthorizationCredentials(scheme="Bearer", credentials=token)
        self.assertEqual(require_admin(credentials), settings.admin_email)

    def test_expired_token_is_rejected(self):
        payload = base64.urlsafe_b64encode(json.dumps({"sub": settings.admin_email, "exp": int(time.time()) - 1}).encode()).decode().rstrip("=")
        signature = hmac.new(settings.admin_token_secret.encode(), payload.encode(), hashlib.sha256).hexdigest()
        with self.assertRaises(HTTPException) as context:
            require_admin(HTTPAuthorizationCredentials(scheme="Bearer", credentials=f"{payload}.{signature}"))
        self.assertEqual(context.exception.status_code, 401)

    def test_login_accepts_valid_credentials_and_rejects_invalid_ones(self):
        client = TestClient(app)
        valid = client.post("/api/admin/login", json={"email": settings.admin_email, "password": settings.admin_password})
        invalid = client.post("/api/admin/login", json={"email": settings.admin_email, "password": "incorrect-password"})
        self.assertEqual(valid.status_code, 200)
        self.assertEqual(valid.json()["token_type"], "bearer")
        self.assertEqual(invalid.status_code, 401)

    def test_login_is_rate_limited(self):
        client = TestClient(app)
        responses = [client.post("/api/admin/login", json={"email": settings.admin_email, "password": "incorrect-password"}) for _ in range(6)]
        self.assertEqual(responses[-1].status_code, 429)

    def test_admin_routes_require_authentication(self):
        response = TestClient(app).get("/api/admin/dashboard")
        self.assertEqual(response.status_code, 401)

    def test_unconfigured_admin_login_is_disabled(self):
        settings.admin_email = "admin@barberia.com"
        settings.admin_password = "change-me"
        settings.admin_token_secret = "change-this-secret"
        response = TestClient(app).post("/api/admin/login", json={"email": settings.admin_email, "password": settings.admin_password})
        self.assertEqual(response.status_code, 503)

    def test_date_helpers_tolerate_bad_data_and_filter_old_visits(self):
        self.assertIsNone(_date("not-a-date"))
        now = datetime.now(timezone.utc)
        visits = [
            {"checked_in_at": now.isoformat()},
            {"checked_in_at": (now - timedelta(days=10)).isoformat()},
            {"checked_in_at": "invalid"},
        ]
        points = _trend(visits, now - timedelta(days=2), "day")
        self.assertEqual(sum(point["value"] for point in points), 1)

    def test_trend_groups_utc_visits_in_the_business_timezone(self):
        settings.business_timezone = "America/Chicago"
        visit_time = datetime(2026, 1, 2, 1, 30, tzinfo=timezone.utc)

        points = _trend(
            [{"checked_in_at": visit_time.isoformat()}],
            datetime(2026, 1, 1, tzinfo=timezone.utc),
            "day",
        )

        self.assertEqual(points, [{"label": "2026-01-01", "value": 1}])

    def test_customer_row_ignores_invalid_visit_dates(self):
        customer = {"id": "1", "first_name": "Ada", "last_name": "Lovelace", "phone": "123", "created_at": None}
        row = _customer_row(customer, [{"checked_in_at": "invalid"}])
        self.assertEqual(row["visits"], 1)
        self.assertIsNone(row["first_visit"])


if __name__ == "__main__":
    unittest.main()
