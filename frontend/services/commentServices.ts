import axiosInstance from "@/lib/api/axiosInstance";
import { CommentResponse,CommentsResponse, CreateCommentRequest, CommentTab} from "@/types/comment";

export const commentService = {
    getComments: async (workspaceId: string, uploadId: string, tab: CommentTab
    ): Promise<CommentsResponse>=> {
        try{
            const response = await axiosInstance.get(`/api/py/workspaces/${workspaceId}/comments`,
                {params: {upload_id: uploadId, tab}}
            );
            return response.data;
        }catch(error: any){
            throw new Error(
                error.response?.data?.detail || "Failed to fetch comments",
            );
        }
    },

    addComment: async (workspaceId: string, payload: CreateCommentRequest): Promise<CommentResponse> =>{
        try{
            const response = await axiosInstance.post(`/api/py/workspaces/${workspaceId}/comments`, payload);
            return response.data;
        }catch(error: any){
            throw new Error(
                error.response?.data?.detail || "Failed to add comment",
            );
        }
    },
};