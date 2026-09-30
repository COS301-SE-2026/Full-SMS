import { Comment } from "@/types/comment";
import { colors } from "@/lib/tokens";

export function buildCommentMarkers(comments: Comment[], xaxis?: string, yaxis?: string) {
    return {
        x: comments.map((c) => c.anchor_x ?? 0),
        y: comments.map((c) => c.anchor_y ?? 0),
        type: 'scatter' as const,
        mode: 'markers' as const,
        name: 'Notes',
        ...(xaxis ? { xaxis } : {}),
        ...(yaxis ? { yaxis } : {}),
        marker: { color: colors.warning, size: 8, symbol: 'star' },
        text: comments.map((c) => c.content),
        hoverinfo: 'text' as const,
    };
}
