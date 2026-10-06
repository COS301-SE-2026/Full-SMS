import { useCallback, useState, useEffect, useRef } from "react";
import { Comment, CommentTab } from "@/types/comment";
import { commentService } from "@/services/commentServices";
import { useLiveComments } from "@/hooks/useLiveComments";

export function useComments(
    workspaceId: string | null,
    uploadId: string,
    tab: CommentTab,
    measurementId?: string,
) {
    const [comments, setComments] = useState<Comment[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const latestRequest = useRef(0);

    const fetchComments = useCallback(async () => {
        if(!workspaceId || !uploadId) return;
        const thisRequest = ++latestRequest.current;
        setLoading(true);
        setError(null);

        try{
            const res = await commentService.getComments(workspaceId, uploadId, tab, measurementId);
            if (thisRequest === latestRequest.current) setComments(res.comments);
        }catch(error: any){
            if (thisRequest === latestRequest.current) setError(error.message);
        }finally{
            if (thisRequest === latestRequest.current) setLoading(false);
        }
    }, [workspaceId, uploadId, tab, measurementId]);

    useEffect(() => {
        //eslint-disable-next-line react-hooks/set-state-in-effect
        fetchComments();
    }, [fetchComments]);

    const receiveComment = useCallback((incoming: Comment) => {
        if (incoming.upload_id !== uploadId || incoming.tab !== tab) return;
        if (measurementId !== undefined && incoming.measurement_id !== measurementId) return;
        setComments((prev) =>
            prev.some((c) => c.id === incoming.id) ? prev : [...prev, incoming],
        );
    }, [uploadId, tab, measurementId]);

    useLiveComments(workspaceId, receiveComment, fetchComments);

    return { comments, loading, error, fetchComments};
}