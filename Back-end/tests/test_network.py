import unittest

from fastapi import HTTPException
from starlette.requests import Request

from app.core.config import settings
from app.core.network import require_allowed_network


class NetworkAccessTests(unittest.TestCase):
    def setUp(self):
        self.original = (
            settings.enforce_client_ip_allowlist,
            settings.allowed_client_ips,
        )
        self.request = Request({
            "type": "http",
            "method": "POST",
            "path": "/api/check-in",
            "headers": [],
            "client": ("203.0.113.50", 12345),
            "server": ("testserver", 80),
            "scheme": "http",
            "query_string": b"",
        })

    def tearDown(self):
        settings.enforce_client_ip_allowlist, settings.allowed_client_ips = self.original

    def test_disabled_allowlist_accepts_any_client_ip(self):
        settings.enforce_client_ip_allowlist = False
        settings.allowed_client_ips = ""
        self.assertIsNone(require_allowed_network(self.request))

    def test_enabled_allowlist_keeps_existing_restriction(self):
        settings.enforce_client_ip_allowlist = True
        settings.allowed_client_ips = "198.51.100.10"
        with self.assertRaises(HTTPException) as context:
            require_allowed_network(self.request)
        self.assertEqual(context.exception.status_code, 403)


if __name__ == "__main__":
    unittest.main()
