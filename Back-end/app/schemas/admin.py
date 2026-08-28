from pydantic import BaseModel, EmailStr, Field


class AdminLogin(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=256)


class AdminToken(BaseModel):
    access_token: str
    token_type: str = "bearer"


class CustomerRow(BaseModel):
    id: str
    name: str
    phone: str
    created_at: str | None
    visits: int
    first_visit: str | None
    last_visit: str | None


class TrendPoint(BaseModel):
    label: str
    value: int


class DashboardMetrics(BaseModel):
    total_customers: int
    total_visits: int
    new_customers: int
    recurring_customers: int
    today_visits: int


class DashboardTrends(BaseModel):
    daily: list[TrendPoint]
    weekly: list[TrendPoint]
    monthly: list[TrendPoint]


class DashboardResponse(BaseModel):
    metrics: DashboardMetrics
    frequent_customers: list[CustomerRow]
    trends: DashboardTrends


class CustomerPage(BaseModel):
    items: list[CustomerRow]
    total: int
    page: int
    page_size: int


class VisitHistory(BaseModel):
    id: str
    status: str
    checked_in_at: str


class CustomerDetail(CustomerRow):
    email: EmailStr
    history: list[VisitHistory]
