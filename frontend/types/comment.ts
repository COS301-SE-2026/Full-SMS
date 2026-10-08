export interface Comment{
    id: string;
    workspace_id: string;
    upload_id: string;
    measurement_id: string | null;
    created_at: string;
    author_id: string;
    anchor_y: number | null;
    anchor_x: number | null;
    content: string;
    tab: "intensity" | "lifetime" | "correlation" | "grouping" | "raster" |"spectra";
}

export interface CommentResponse{
    success: boolean;
    comment: Comment;
}

export interface CommentsResponse{
    success: boolean;
    comments: Comment[];
}

export interface CreateCommentRequest{
    anchor_y?: number;
    anchor_x?: number;
    content: string;
    upload_id: string;
    measurement_id?: string;
    tab: "intensity" | "lifetime" | "correlation" | "grouping" | "raster" | "spectra";
}

export type CommentTab = "intensity" | "lifetime" | "correlation" | "grouping" | "raster" |"spectra";