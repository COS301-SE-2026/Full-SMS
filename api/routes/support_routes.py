from fastapi import APIRouter
from api.controllers.support_controller import handle_send_email

support_router = APIRouter(prefix="/support",tags=["support"])


@support_router.post("/")
def support(user_email:str, message:str):
    return handle_send_email(user_email, message)

