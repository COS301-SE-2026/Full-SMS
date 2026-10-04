from collections import defaultdict
from fastapi import WebSocket


class CommentHub:
    def __init__(self) -> None:
        self._rooms: dict[str, set[WebSocket]] = defaultdict(set)

    async def join(self, workspace_id: str, websocket: WebSocket) -> None:
        await websocket.accept()
        self._rooms[workspace_id].add(websocket)

    def leave(self, workspace_id: str, websocket: WebSocket) -> None:
        room = self._rooms.get(workspace_id)
        if room is None:
            return
        room.discard(websocket)
        if not room:
            self._rooms.pop(workspace_id, None)

    async def broadcast(self, workspace_id: str, message: dict) -> None:
        dead: list[WebSocket] = []
        for websocket in list(self._rooms.get(workspace_id, ())):
            try:
                await websocket.send_json(message)
            except Exception:
                dead.append(websocket)
        for websocket in dead:
            self.leave(workspace_id, websocket)


comment_hub = CommentHub()
