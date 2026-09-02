from pydantic import BaseModel, Field, field_validator


class UserRegister(BaseModel):
    name: str = Field(min_length=2, max_length=80)
    email: str
    password: str = Field(min_length=6)

    @field_validator("email")
    @classmethod
    def validate_email(cls, v: str) -> str:
        if "@" not in v or "." not in v.split("@")[-1]:
            raise ValueError("Invalid email address")
        return v.lower()
    role: str = Field(pattern="^(farmer|buyer|officer)$")
    region: str
    phone: str | None = None
    preferred_language: str = "en"
    
    # Farmer fields
    farm_location: str | None = None
    crop_types: str | None = None
    
    # Buyer fields
    company_name: str | None = None
    company_location: str | None = None
    delivery_address: str | None = None
    
    # Officer fields
    officer_id: str | None = None
    department: str | None = None
    district: str | None = None
    designation: str | None = None


class UserLogin(BaseModel):
    phone: str
    password: str


class OTPVerify(BaseModel):
    phone: str
    otp: str


class UserOut(BaseModel):
    id: str
    name: str
    email: str
    role: str
    region: str
    phone: str | None = None
    preferred_language: str = "en"
    
    # Farmer fields
    farm_location: str | None = None
    crop_types: str | None = None
    
    # Buyer fields
    company_name: str | None = None
    company_location: str | None = None
    delivery_address: str | None = None
    
    # Officer fields
    officer_id: str | None = None
    department: str | None = None
    district: str | None = None
    designation: str | None = None


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class ProfileUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=80)
    phone: str | None = None
    region: str | None = None
    preferred_language: str | None = None
