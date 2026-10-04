import { useState } from "react";
import { History, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui";

interface CommentToolbarButtonsProps {
    commentsOpen: boolean;
    onToggleComments: () => void;
    onNewComment: () => void;
    commentCount?: number;
    historyOpen?: boolean;
    onToggleHistory?: () => void;
    className?: string;
}

export function CommentToolbarButtons({
    commentsOpen,
    onToggleComments,
    onNewComment,
    commentCount = 0,
    historyOpen,
    onToggleHistory,
    className,
}: Readonly<CommentToolbarButtonsProps>) {
    return (
        <div className={`flex items-center gap-2 ${className ?? ""}`}>
            {onToggleHistory && (
                <Button
                    variant="ghost"
                    size="sm"
                    title="View Parameter history"
                    onClick={onToggleHistory}
                    className={`px-2 py-0.5 min-h-0 ${historyOpen ? "bg-card" : ""}`}
                    leftIcon={<History size={14} />}
                />
            )}
            <div className="relative">
                <Button
                    variant="ghost"
                    size="sm"
                    title="View Comments"
                    onClick={onToggleComments}
                    className={`px-2 py-0.5 min-h-0 ${commentsOpen ? "bg-card" : ""}`}
                    leftIcon={<MessageSquare size={14} />}
                />
                {commentCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-primary text-background text-[10px] leading-4 text-center font-mono pointer-events-none">
                        {commentCount > 9 ? "9+" : commentCount}
                    </span>
                )}
            </div>
            <Button variant="secondary" size="sm" onClick={onNewComment}>
                New Comment
            </Button>
        </div>
    );
}

interface NewCommentInputProps {
    open: boolean;
    onSubmit: (payload: { content: string }) => void;
    onClose: () => void;
}

export function NewCommentInput({ open, onSubmit, onClose }: Readonly<NewCommentInputProps>) {
    const [text, setText] = useState("");

    if (!open) return null;

    const submit = () => {
        if (!text.trim()) return;
        onSubmit({ content: text });
        setText("");
        onClose();
    };

    return (
        <div className="flex gap-2 items-center p-2 border-b border-border">
            <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Add a comment..."
                className="border border-border bg-card rounded flex-1 text-xs px-2 py-1"
            />
            <Button onClick={submit} variant="primary">
                Add
            </Button>
            <Button onClick={onClose} variant="secondary">
                Cancel
            </Button>
        </div>
    );
}
