import { Comment } from "@/types/comment";
import { useEffect, useRef } from "react";
import { WorkspaceMemberProfile } from "@/types/workspace";


interface CommentProps{
    readonly comments: Comment[];
    readonly loading: boolean;
    readonly error: string | null;
    readonly authorFinder: Record<string,WorkspaceMemberProfile>;
}

export function CommentPanel({comments, loading, error, authorFinder}: CommentProps){
    const refPanel = useRef<HTMLDivElement>(null);

    useEffect(() => {
        refPanel.current?.scrollIntoView({inline: "end", block: "nearest", behavior: "smooth"});
    },[loading, comments.length]);

    if(loading) return <div ref={refPanel} className="shrink-0 w-80"><p className="text-sm">Loading comments...</p></div>
    if(error) return <p className="text-sm text-red-600">{error}</p>
    if(comments.length === 0) return <div className="shrink-0 w-80" ref={refPanel}><p className="text-sm">No comments</p></div>

    const getAuthor = (authorId: string) => {
        const user = authorFinder[authorId];
        return user?.username || user?.email || "Unknown user";
    };

    return(
        <div ref={refPanel} className="shrink-0 w-80 max-h-[85vh] overflow-y-auto">
            <h4 className="mb-2 text-xs font-semibold text-foreground/70">Comment Panel</h4>
            <ul className="text-sm space-y-1">
                {comments.map((comment) => (
                    <li key={comment.id} className="border-b border-border/40 pb-1 flex flex-col gap-1">
                        <span className="font-semibold text-xs">
                            {getAuthor(comment.author_id)}
                        </span>
                        <span className="font-normal text-sm">
                            {comment.content}
                        </span>
                        <span className="text-gray-500 text-xs">
                            {new Date(comment.created_at).toLocaleString()}
                        </span>
                    </li>
                ))}
            </ul>
        </div>
    );
}