from fastapi import UploadFile, HTTPException
from pathlib import Path
from api.services.upload_service import save_temp_file, get_file_size

ALLOWED_EXTENSIONS = {".pt3", ".csv", ".h5", ".hdf5"}

async def handle_upload(file: UploadFile) -> dict:
    # 1. Validate file extension
    ext = Path(file.filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type: '{ext}'. Allowed types: {ALLOWED_EXTENSIONS}"
        )

    # 2. Save the file to disk
    saved_path = await save_temp_file(file)

    # 3. Get file size
    size = get_file_size(saved_path)

    # 4. Return response
    return {
        "message": "File uploaded successfully",
        "filename": file.filename,
        "saved_as": saved_path.name,
        "size_bytes": size,
        "status": "pending"
    }