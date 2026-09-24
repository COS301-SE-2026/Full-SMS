import { useState } from "react";
import { HistoryEntry, HistoryTab } from "@/types/parameterHistory";
import { use } from "chai";

export function useHistory(
    workspaceId: string | null,
    uploadId: string,
    tab: HistoryTab,
) {
    const [entries, setEntries] = useState<HistoryEntry[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    return {entries, loading, error}; 
}