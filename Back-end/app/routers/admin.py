from collections import Counter
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from supabase import Client
from app.core.admin_auth import create_admin_token, require_admin
from app.core.config import settings
from app.core.rate_limit import limiter
from app.schemas.admin import AdminLogin, AdminToken, CustomerDetail, CustomerPage, DashboardResponse
from app.services.supabase_service import get_supabase

router = APIRouter(prefix="/api/admin", tags=["admin"])


def _date(value: str | None) -> datetime | None:
    if not value:
        return None
    try:
        parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
        return parsed if parsed.tzinfo else parsed.replace(tzinfo=timezone.utc)
    except (TypeError, ValueError):
        return None


def _dataset(db: Client):
    customers = db.table("customers").select("id, first_name, last_name, email, phone, created_at").execute().data or []
    visits = db.table("check_ins").select("id, customer_id, status, checked_in_at, created_at").execute().data or []
    visits_by_customer: dict[str, list[dict]] = {}
    for visit in visits:
        visits_by_customer.setdefault(visit["customer_id"], []).append(visit)
    return customers, visits, visits_by_customer


@router.post("/login", response_model=AdminToken)
@limiter.limit(settings.admin_login_rate_limit)
def login(request: Request, payload: AdminLogin):
    if not settings.admin_credentials_configured:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Admin authentication is not configured")
    email_valid = hmac_compare(payload.email, settings.admin_email, normalize=True)
    password_valid = hmac_compare(payload.password, settings.admin_password)
    if not (email_valid and password_valid):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    return AdminToken(access_token=create_admin_token())


def hmac_compare(left: str, right: str, normalize: bool = False) -> bool:
    import hmac
    if normalize:
        left, right = left.strip().lower(), right.strip().lower()
    return hmac.compare_digest(left, right)


@router.get("/dashboard", response_model=DashboardResponse)
def dashboard(_: str = Depends(require_admin), db: Client = Depends(get_supabase)):
    customers, visits, by_customer = _dataset(db)
    now = datetime.now(settings.business_zone)
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    customer_rows = [_customer_row(customer, by_customer.get(customer["id"], [])) for customer in customers]
    daily = _trend(visits, now - timedelta(days=29), "day")
    weekly = _trend(visits, now - timedelta(weeks=7), "week")
    monthly = _trend(visits, now - timedelta(days=180), "month")
    return {
        "metrics": {"total_customers": len(customers), "total_visits": len(visits), "new_customers": sum(1 for c in customers if (_date(c.get("created_at")) or now) >= month_start), "recurring_customers": sum(1 for row in customer_rows if row["visits"] > 1), "today_visits": sum(1 for v in visits if (_date(v.get("checked_in_at")) or now) >= today_start)},
        "frequent_customers": sorted(customer_rows, key=lambda row: row["visits"], reverse=True)[:8],
        "trends": {"daily": daily, "weekly": weekly, "monthly": monthly},
    }


@router.get("/customers", response_model=CustomerPage)
def customers(search: str = Query(""), page: int = Query(1, ge=1), page_size: int = Query(10, ge=1, le=100), sort: str = Query("visits"), direction: str = Query("desc"), _: str = Depends(require_admin), db: Client = Depends(get_supabase)):
    all_customers, _, by_customer = _dataset(db)
    rows = [_customer_row(customer, by_customer.get(customer["id"], [])) for customer in all_customers]
    needle = search.strip().lower()
    if needle:
        rows = [row for row in rows if needle in f'{row["name"]} {row["phone"]}'.lower()]
    key = (lambda row: (row.get(sort) or "")) if sort in {"name", "phone", "created_at", "visits", "last_visit"} else (lambda row: row["visits"])
    rows.sort(key=key, reverse=direction == "desc")
    start = (page - 1) * page_size
    return {"items": rows[start:start + page_size], "total": len(rows), "page": page, "page_size": page_size}


@router.get("/customers/{customer_id}", response_model=CustomerDetail)
def customer_detail(customer_id: str, _: str = Depends(require_admin), db: Client = Depends(get_supabase)):
    customers, visits, _ = _dataset(db)
    customer = next((item for item in customers if item["id"] == customer_id), None)
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    history = [visit for visit in visits if visit["customer_id"] == customer_id]
    row = _customer_row(customer, history)
    return {**row, "email": customer["email"], "history": sorted(history, key=lambda item: item.get("checked_in_at", ""), reverse=True)}


def _customer_row(customer: dict, visits: list[dict]) -> dict:
    dates = [date for visit in visits if (date := _date(visit.get("checked_in_at"))) is not None]
    return {"id": customer["id"], "name": f'{customer["first_name"]} {customer["last_name"]}', "phone": customer["phone"], "created_at": customer.get("created_at"), "visits": len(visits), "first_visit": min(dates).isoformat() if dates else None, "last_visit": max(dates).isoformat() if dates else None}


def _trend(visits: list[dict], start: datetime, period: str) -> list[dict]:
    buckets = Counter()
    business_start = start.astimezone(settings.business_zone)
    for visit in visits:
        date = _date(visit.get("checked_in_at"))
        if not date:
            continue
        business_date = date.astimezone(settings.business_zone)
        if business_date < business_start:
            continue
        if period == "day": key = business_date.strftime("%Y-%m-%d")
        elif period == "week": key = (business_date - timedelta(days=business_date.weekday())).strftime("%Y-%m-%d")
        else: key = business_date.strftime("%Y-%m")
        buckets[key] += 1
    return [{"label": key, "value": buckets[key]} for key in sorted(buckets)]
