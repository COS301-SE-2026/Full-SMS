import { HistoryEntry } from "@/types/parameterHistory";
import { Button } from "@/components/ui";

interface HistoryPanelProps {
    entries: HistoryEntry[];
    loading: boolean;
    error: string | null;
    onRevert: (entry: HistoryEntry) => void;
}

export function HistoryPanel({entries, loading, error, onRevert}: HistoryPanelProps) {
    if(loading) return <p className="text-sm">Loading history...</p>;
    if(error) return <p className="text-sm text-red-600">{error}</p>;
    if(entries.length === 0) return <p className="text-sm">No changes yet.</p>;

    return (
        <div>
        <h4 className="text-xs font-semibold text-foreground/70 mb-2">Parameter History</h4>
        <ul className="space-y-1 text-sm">
            {entries.map((e) => (
                <li key={e.id} className="flex items-center justify-between gap-2">
                    <span>
                        {e.parameter}: {typeof e.old_value === "object" ? "updated" : `${e.old_value || "Plasma"} to ${e.new_value || "Plasma"}`}
                    </span>

                    <span className="text-xs text-gray-500">
                        {new Date(e.created_at).toLocaleString()}
                    </span>

                    <Button 
                        variant="outline"
                        size="sm"
                        title="Undo this change and restore the previous value"
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