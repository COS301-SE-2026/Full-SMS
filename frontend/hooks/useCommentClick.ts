import { useState } from "react";

interface AddCommentPayload {
    content: string;
    anchor_x: number;
    anchor_y: number;
}

export function useCommentClick(onAddComment: (payload: AddCommentPayload) => void) {
    const [progressSpot, setProgressSpot] = useState<{ x: number; y: number } | null>(null);
    const [noteText, setNoteText] = useState('');

    const controlPlotClick = (event: any) => {
        const point = event.points?.[0];
        if (!point) return;
        setProgressSpot({ x: point.x, y: point.y });
    };

    const controlSubmitNote = () => {
        if (!progressSpot || !noteText.trim()) return;
        onAddComment({ content: noteText, anchor_x: progressSpot.x, anchor_y: progressSpot.y });
        setProgressSpot(null);
        setNoteText('');
    };

    return { progressSpot, setProgressSpot, noteText, setNoteText, controlPlotClick, controlSubmitNote };
}
