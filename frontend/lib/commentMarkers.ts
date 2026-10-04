import { Comment } from "@/types/comment";
import { colors } from "@/lib/tokens";

export function buildCommentMarkers(allComments: Comment[], xaxis?: string, yaxis?: string) {
    const comments = allComments.filter((c) => c.anchor_x !== null && c.anchor_y !== null);
    return {
        x: comments.map((c) => c.anchor_x as number),
        y: comments.map((c) => c.anchor_y as number),
        type: 'scatter' as const,
        mode: 'text' as const,
        name: 'Notes',
        ...(xaxis ? { xaxis } : {}),
        ...(yaxis ? { yaxis } : {}),
        text: comments.map(() => '💬'),
        textposition: 'middle center' as const,
        textfont: { color: colors.warning, size: 16 },
        hovertext: comments.map((c) => c.content),
        hoverinfo: 'text' as const,
    };
}
