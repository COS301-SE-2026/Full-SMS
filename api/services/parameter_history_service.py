from typing import List
from api.services.workspace_service import get_workspace_by_id

def list_history(workspace_id:str, user_id: str, upload_id: str, tab:str, limit:int =100) -> List[dict]:
    get_workspace_by_id(workspace_id, user_id)
    return[]