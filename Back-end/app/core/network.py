from ipaddress import ip_address, ip_network

from fastapi import HTTPException, Request, status

from app.core.config import settings


def get_client_ip(request: Request) -> str:
    peer_ip = request.client.host if request.client else ""
    try:
        peer = ip_address(peer_ip)
    except ValueError:
        return peer_ip

    trusted_proxies = [ip_network(cidr) for cidr in settings.trusted_proxy_cidr_list]
    if any(peer in network for network in trusted_proxies):
        forwarded_ip = request.headers.get("CF-Connecting-IP", "").strip()
        try:
            ip_address(forwarded_ip)
            return forwarded_ip
        except ValueError:
            pass

    return peer_ip


def require_allowed_network(request: Request) -> None:
    allowed_ips = settings.allowed_client_ip_list
    if not allowed_ips:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Network access is not configured",
        )

    client_ip = get_client_ip(request)
    try:
        allowed = any(client_ip == ip_address(value).compressed for value in allowed_ips)
    except ValueError:
        allowed = False

    if not allowed:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access is not available from this network",
        )