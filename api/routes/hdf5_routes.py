from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from api.routes.profile_routes import get_current_user
from api.controllers.hdf5_controller import (get_user_uploads_by_id, read_hdf5_file, init_hdf5_upload, complete_hdf5_upload, get_hdf5_upload_status, get_hdf5_upload_result)

router = APIRouter(prefix="/hdf5", tags=["hdf5"])

@router.post("/uploads/init")
async def init_upload(payload: dict, current_user: dict = Depends(get_current_user)):
    return await init_hdf5_upload(payload, current_user)

@router.post("/uploads/{upload_id}/complete")
async def complete_upload(upload_id: str, payload: dict, current_user: dict = Depends(get_current_user)):
    return await complete_hdf5_upload(upload_id, payload, current_user)

@router.get("/uploads/{upload_id}")
async def upload_status(upload_id: str, current_user: dict = Depends(get_current_user)):
    return await get_hdf5_upload_status(upload_id, current_user)

@router.get("/uploads/{upload_id}/result")
async def upload_result(upload_id: str, current_user: dict = Depends(get_current_user)):
    return await get_hdf5_upload_result(upload_id, current_user)

@router.get("/user-uploads")
async def get_user_uploads( current_user:dict =Depends(get_current_user)):
    return await get_user_uploads_by_id(current_user["user"]["id"])


@router.post("/read")
async def read(file: UploadFile = File(...)):
    return await read_hdf5_file(file)