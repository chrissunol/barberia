from slowapi import Limiter

from app.core.config import settings
from app.core.network import get_client_ip

limiter = Limiter(key_func=get_client_ip, storage_uri=settings.rate_limit_storage_uri)
