import { HistoryEntry } from "@/types/parameterHistory";
import { Button } from "@/components/ui";
import { useEffect, useRef } from "react";

interface WorkspaceMemberProfile{
    id: string;
    email: string;
    username: string | null;
    role: string;
}

interface HistoryPanelProps {
    entries: HistoryEntry[];
    loading: boolean;
    error: string | null;
    onRevert: (entry: HistoryEntry) => void;
    members: WorkspaceMemberProfile[];
}

export function HistoryPanel({entries, loading, error, onRevert, members}: Readonly<HistoryPanelProps>) {
    const panelRef=useRef<HTMLDivElement>(null);

    useEffect(() => {
        panelRef.current?.scrollIntoView({behavior:"smooth", block: "nearest", inline:"end"});
    }, [loading, entries.length]);

    const getAuthorLabel = (authorId: string) =>{
        const member = members.find((m) => m.id === authorId);
        return member?.username || member?.email || "Unknown user";
    };

    if(loading) return <div ref={panelRef} className="w-80 shrink-0"><p className="text-sm">Loading history...</p></div>;
    if(error) return <p className="text-sm text-red-600">{error}</p>;
    if(entries.length === 0) return <div ref={panelRef} className="w-80 shrink-0"><p className="text-sm">No changes yet.</p></div>;

    return (
        <div ref={panelRef} className="w-80 shrink-0 max-h-[85vh] overflow-y-auto">
        <h4 className="text-xs font-semibold text-foreground/70 mb-2">Parameter History</h4>
        <ul className="space-y-1 text-sm">
            {entries.map((e) => (
                <li key={e.id} className="flex flex-col gap-1 border-b border-border/40 pb-1">
                    <span className="text-xs break-words">
                        {e.parameter}: {typeof e.old_value === "object" ? "updated" : `${e.old_value==="" || e.old_value==null ? "default": e.old_value} to ${e.new_value==="" || e.new_value==null ? "default": e.new_value} `}
                    </span>

                    <span className="text-xs text-gray-500">
                        {getAuthorLabel(e.author_id)} - {new Date(e.created_at).toLocaleString()}
                    </span>

                    <Button 
                        variant="outline"
                        size="sm"
                        title="Undo this change and restore the previous"
                        onClick={() => onRevert(e)}
                        className="px-2 py-0.5 text-xs min-h-0"
                    >
                        Revert
                    </Button>
                </li>
            ))}
        </ul>
        </div>
    );
}