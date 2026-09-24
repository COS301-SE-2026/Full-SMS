import { useCallback, useState } from "react";
import { HistoryEntry, HistoryTab } from "@/types/parameterHistory";
import { historyService } from "@/services/historyServices";

export function useHistory(
    workspaceId: string | null,
    uploadId: string,
    tab: HistoryTab,
) {
    const [entries, setEntries] = useState<HistoryEntry[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchHistory = useCallback(async () => {
        if(!workspaceId || !uploadId) return;
        setLoading(true);
        setError(null);
        try {
            const res = await historyService.getHistory(workspaceId, uploadId, tab);
            setEntries(res.history);
        }catch(e: any) {
            setError(e.messsage);
        }finally {
            setLoading(false);
        }
    }, [workspaceId, uploadId, tab]); 

    return {entries, loading, error, fetchHistory}; 
}