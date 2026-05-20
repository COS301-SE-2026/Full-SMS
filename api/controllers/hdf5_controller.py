import os
import tempfile
from pathlib import Path
from fastapi import UploadFile, HTTPException
import api.services.hdf5_services as read_hdf5_service

async def read_hdf5_file(file: UploadFile):
    if not file.filename.endswith((".hdf5", ".h5")):
        raise HTTPException(status_code=400, detail="Invalid file type. Please upload an HDF5 file.")

    tmp_path = None
    try:
        fd, tmp_path = tempfile.mkstemp(suffix=".h5")
        os.close(fd)
        with open(tmp_path, "wb") as f:
            f.write(await file.read())

        return read_hdf5_service.read_hdf5(Path(tmp_path))
    finally:
        if tmp_path and os.path.exists(tmp_path):
            os.remove(tmp_path)