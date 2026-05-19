from pydantic import BaseModel
from typing import Optional

class UserProfile(BaseModel)
    id: str
    email: str
    username: Optional[str] = None
    role: Optional[str] = "researcher"

class UpdateProfileRequest(BaseModel):
    username: Optional[str] = None
    new_password:  Optional[str] = None

class UpdateProfileResponse(BaseModel):
    success: bool
    message: str
    user: Optional[UserProfile] = None
