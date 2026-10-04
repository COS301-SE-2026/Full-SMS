import { useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase/supabaseConfig";
import { Comment } from "@/types/comment";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const WS_BASE = API_BASE.replace(/^http/, "ws");

export function useLiveComments(
    workspaceId: string | null,
    onComment: (comment: Comment) => void,
    onReconnect: () => void,
) {
    const onCommentRef = useRef(onComment);
    const onReconnectRef = useRef(onReconnect);

    useEffect(() => {
        onCommentRef.current = onComment;
        onReconnectRef.current = onReconnect;
    }, [onComment, onReconnect]);

    useEffect(() => {
        if (!workspaceId) return;

        let socket: WebSocket | null = null;
        let retryTimer: ReturnType<typeof setTimeout> | undefined;
        let attempts = 0;
        let stopped = false;
        let hasOpenedBefore = false;

        const connect = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (stopped || !session?.access_token) return;

            const token = encodeURIComponent(session.access_token);
            socket = new WebSocket(`${WS_BASE}/api/py/workspaces/${workspaceId}/comments/live?token=${token}`);

            socket.onopen = () => {
                attempts = 0;
                if (hasOpenedBefore) onReconnectRef.current();
                hasOpenedBefore = true;
            };

            socket.onmessage = (event) => {
                try {
                    const message = JSON.parse(event.data);
                    if (message.type === "comment_added") {
                        onCommentRef.current(message.comment as Comment);
                    }
                } catch {
                    return;
                }
            };

            socket.onclose = (event) => {
                if (stopped) return;
                if (event.code === 4401 || event.code === 4403) return;
                retryTimer = setTimeout(connect, Math.min(1000 * 2 ** attempts++, 15000));
            };
        };

        connect();

        return () => {
            stopped = true;
            if (retryTimer) clearTimeout(retryTimer);
            socket?.close();
        };
    }, [workspaceId]);
}
