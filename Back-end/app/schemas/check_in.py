from pydantic import BaseModel, EmailStr, Field, field_validator
import re


class CheckInCreate(BaseModel):
    first_name: str = Field(min_length=2, max_length=100)
    last_name: str = Field(min_length=2, max_length=100)
    email: EmailStr
    phone: str = Field(min_length=7, max_length=30)
    how_heard: str = Field(min_length=1, max_length=50)

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
    def clean_how_heard(cls, value: str) -> str:
        return value.strip()


class CheckInResponse(BaseModel):
    success: bool
    message: str
    check_in_id: str
    customer_id: str
