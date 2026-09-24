import { HistoryTab } from "@/types/parameterHistory";
import { useCallback,useRef } from "react";

export function usehistoryRecorder(
    workspaceId: string | null,
    uploadId: string,
    tab: HistoryTab,
){
    const firstValues = useRef<Record<string, number>>({});

    return useCallback(
        (parameter: string, newValue: number) => {
            if(!(parameter in firstValues.current)){
                firstValues.current[parameter] = newValue;
            }
        },
        [workspaceId, uploadId, tab],
    ); 
}