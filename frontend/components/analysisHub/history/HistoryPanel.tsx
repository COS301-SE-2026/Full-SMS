import { HistoryEntry } from "@/types/parameterHistory";

interface HistoryPanelProps {
    entries: HistoryEntry[];
    loading: boolean;
    error: string | null;
    onRevert: (entry: HistoryEntry) => void;
}

export function historyPanel({entries, loading, error, onRevert}: HistoryPanelProps) {
    if(loading) return <p className="text-sm">Loading history...</p>;
    if(error) return < p className="text-sm text-red-600">{error}</p>;
    if(entries.length === 0) return <p className="text-sm">No changes yet.</p>;

    return (
        <ul className="space-y-1 text-sm">
            {entries.map((e) => (
                <li key={e.id} className="flex items-center justify-between gap-2">
                    <span>
                        {e.parameter}: {String(e.old_value)} to {String(e.new_value)}
                    </span>

                    <span className="text-xs text-gray-500">
                        {new Date(e.created_at).toLocaleString()}
                    </span>

                    <button className="text-xs underline" onClick={() => onRevert(e)}>
                        Revert
                    </button>
                </li>
            ))}
        </ul>
    );
}