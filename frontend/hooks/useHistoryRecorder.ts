import { HistoryTab } from "@/types/parameterHistory";
import { useCallback } from "react";

export function usehistoryRecorder(
    workspaceId: string | null,
    uploadId: string,
    tab: HistoryTab,
){
    return useCallback(
        (parameter: string, newValue: number) => {},
        [workspaceId, uploadId, tab],
    ); 
}