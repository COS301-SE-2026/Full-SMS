from fastapi import APIRouter, UploadFile, File, HTTPException
from api.controllers.hdf5_controller import read_hdf5_file

router = APIRouter(prefix="/hdf5", tags=["hdf5"])

@router.post("/read")
async def read(file: UploadFile = File(...)):
    return await read_hdf5_file(file)