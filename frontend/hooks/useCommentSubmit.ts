import { useCallback } from "react";
import { commentService } from "@/services/commentServices";
import { useToast } from "@/contexts/toastContext/ToastContext";
import { CommentTab } from "@/types/comment";

interface AddCommentPayload {
    content: string;
    anchor_x?: number;
    anchor_y?: number;
}

export function useCommentSubmit(
    workspaceId: string | null,
    uploadId: string,
    tab: CommentTab,
    fetchComments: () => void,
) {
    const { successToast, errorToast } = useToast();

    const addComment = useCallback(
        async (payload: AddCommentPayload) => {
            if (!workspaceId || !uploadId) return;
            try {
                await commentService.addComment(workspaceId, {
                    content: payload.content,
                    anchor_x: payload.anchor_x,
                    anchor_y: payload.anchor_y,
                    upload_id: uploadId,
                    tab,
                });
                fetchComments();
                successToast("Comment has been added successfully");
            } catch (error: any) {
                errorToast(error.message || "Failed to add comment");
            }
        },
        [workspaceId, uploadId, tab, fetchComments, successToast, errorToast],
    );

    return addComment;
}
