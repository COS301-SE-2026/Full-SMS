from fastapi import APIRouter, UploadFile, File
from controllers.upload_controller import handle_upload

router = APIRouter(prefix="/upload", tags=["upload"])

@router.post("/")
async def upload_file(file: UploadFile = File(...)):
    return await handle_upload(file)