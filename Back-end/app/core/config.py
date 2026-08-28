from pydantic_settings import BaseSettings, SettingsConfigDict
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError


class Settings(BaseSettings):
    supabase_url: str
    supabase_key: str
    frontend_origin: str = "http://localhost:4200"
    allowed_client_ips: str = ""
    trusted_proxy_cidrs: str = ""
    rate_limit: str = "5/minute"
    rate_limit_storage_uri: str = "memory://"
    admin_login_rate_limit: str = "5/minute"
    admin_email: str = ""
    admin_password: str = ""
    admin_token_secret: str = ""
    admin_token_ttl_seconds: int = 28800
    business_timezone: str = "America/Chicago"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @property
    def allowed_client_ip_list(self) -> list[str]:
        return [ip.strip() for ip in self.allowed_client_ips.split(",") if ip.strip()]

    @property
    def trusted_proxy_cidr_list(self) -> list[str]:
        return [cidr.strip() for cidr in self.trusted_proxy_cidrs.split(",") if cidr.strip()]

    @property
    def frontend_origin_list(self) -> list[str]:
        return [origin.strip().rstrip("/") for origin in self.frontend_origin.split(",") if origin.strip()]

    @property
    def admin_credentials_configured(self) -> bool:
        return (
            bool(self.admin_email.strip())
            and "@" in self.admin_email
            and not self.admin_password.startswith("change-")
            and len(self.admin_password) >= 12
            and not self.admin_token_secret.startswith("change-")
            and len(self.admin_token_secret) >= 32
        )

    @property
    def business_zone(self) -> ZoneInfo:
        try:
            return ZoneInfo(self.business_timezone)
        except ZoneInfoNotFoundError as exc:
            raise ValueError(f"Unknown business timezone: {self.business_timezone}") from exc


settings = Settings()
