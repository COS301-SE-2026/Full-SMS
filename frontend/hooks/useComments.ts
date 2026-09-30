import { useCallback, useState, useEffect } from "react";
import { Comment, CommentTab } from "@/types/comment";
import { commentService } from "@/services/commentServices";

export function useComments(
    workspaceId: string | null,
    uploadId: string,
    tab: CommentTab,
) {
    const [comments, setComments] = useState<Comment[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchComments = useCallback(async () => {
        if(!workspaceId || !uploadId) return;
        setLoading(true);
        setError(null);
        
        try{
            const res = await commentService.getComments(workspaceId, uploadId, tab);
            setComments(res.comments);
        }catch(error: any){
            setError(error.message);
        }finally{
            setLoading(false);
        }
    }, [workspaceId, uploadId, tab]);

    useEffect(() => {
        fetchComments();
    }, [fetchComments]);

    return { comments, loading, error, fetchComments};
}