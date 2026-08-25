from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    supabase_url: str
    supabase_key: str
    frontend_origin: str = "http://localhost:4200"
    allowed_client_ips: str = ""
    trusted_proxy_cidrs: str = ""
    rate_limit: str = "5/minute"
    rate_limit_storage_uri: str = "memory://"

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


settings = Settings()
