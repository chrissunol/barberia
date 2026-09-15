from typing import Self

from pydantic import BaseModel, EmailStr, Field, field_validator, model_validator
import re


class CheckInCreate(BaseModel):
    first_name: str = Field(min_length=2, max_length=100)
    last_name: str = Field(min_length=2, max_length=100)
    email: EmailStr
    phone: str = Field(min_length=7, max_length=30)
    is_new_customer: bool = True
    has_appointment: bool = False
    how_heard: str | None = Field(default=None, max_length=50)

    @field_validator("first_name", "last_name")
    @classmethod
    def clean_name(cls, value: str) -> str:
        return " ".join(value.strip().split())

    @field_validator("phone")
    @classmethod
    def clean_phone(cls, value: str) -> str:
        digits = re.sub(r"\D", "", value)
        if len(digits) < 7:
            raise ValueError("Invalid phone number")
        return digits

    @field_validator("how_heard")
    @classmethod
    def clean_how_heard(cls, value: str | None) -> str | None:
        cleaned = value.strip() if value else ""
        return cleaned or None

    @model_validator(mode="after")
    def require_how_heard_for_new_customers(self) -> Self:
        if self.is_new_customer and not self.how_heard:
            raise ValueError("How the customer heard about the barbershop is required for new customers")
        return self


class CheckInResponse(BaseModel):
    success: bool
    message: str
    check_in_id: str
    customer_id: str
