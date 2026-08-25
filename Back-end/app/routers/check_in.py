from fastapi import APIRouter, Depends, HTTPException, Request, status
from slowapi import Limiter
from supabase import Client
from app.core.config import settings
from app.core.network import get_client_ip, require_allowed_network
from app.schemas.check_in import CheckInCreate, CheckInResponse
from app.services.supabase_service import get_supabase

router = APIRouter(prefix="/api/check-in", tags=["check-in"])
limiter = Limiter(key_func=get_client_ip, storage_uri=settings.rate_limit_storage_uri)


@router.post("", response_model=CheckInResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit(settings.rate_limit)
def create_check_in(
    request: Request,
    payload: CheckInCreate,
    _: None = Depends(require_allowed_network),
    db: Client = Depends(get_supabase),
):
    try:
        existing = (
            db.table("customers")
            .select("id, first_name, last_name, email, phone, how_heard")
            .eq("phone", payload.phone)
            .limit(1)
            .execute()
        )

        if existing.data:
            customer = existing.data[0]
            customer_id = customer["id"]

            updates = {}
            if customer.get("first_name") != payload.first_name:
                updates["first_name"] = payload.first_name
            if customer.get("last_name") != payload.last_name:
                updates["last_name"] = payload.last_name
            if customer.get("email") != str(payload.email):
                updates["email"] = str(payload.email)
            if customer.get("how_heard") != payload.how_heard:
                updates["how_heard"] = payload.how_heard

            if updates:
                db.table("customers").update(updates).eq("id", customer_id).execute()
        else:
            created = (
                db.table("customers")
                .insert({
                    "first_name": payload.first_name,
                    "last_name": payload.last_name,
                    "email": str(payload.email),
                    "phone": payload.phone,
                    "how_heard": payload.how_heard,
                })
                .execute()
            )
            customer_id = created.data[0]["id"]

        check_in = (
            db.table("check_ins")
            .insert({"customer_id": customer_id, "status": "waiting"})
            .execute()
        )

        return CheckInResponse(
            success=True,
            message="Check-in completed",
            check_in_id=check_in.data[0]["id"],
            customer_id=customer_id,
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail="Unable to complete check-in") from exc
