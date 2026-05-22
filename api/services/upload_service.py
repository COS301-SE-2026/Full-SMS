import shutil
import uuid
from pathlib import Path
from fastapi import UploadFile

API_ROOT = Path(__file__).resolve().parent.parent  # points to api/
TEMP_DIR = API_ROOT / "tmp" / "sms_uploads"

async def save_temp_file(file: UploadFile) -> Path:
    TEMP_DIR.mkdir(parents=True, exist_ok=True)
    unique_name = f"{uuid.uuid4()}_{file.filename}"
    dest = TEMP_DIR / unique_name
    with dest.open("wb") as f:
        shutil.copyfileobj(file.file, f)
    return dest

def get_file_size(path: Path) -> int:
    return path.stat().st_size