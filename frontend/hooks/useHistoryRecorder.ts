import { HistoryTab } from "@/types/parameterHistory";
import { useCallback,useRef } from "react";

export function usehistoryRecorder(
    workspaceId: string | null,
    uploadId: string,
    tab: HistoryTab,
){
    const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
    const firstValues = useRef<Record<string, number>>({});


    return useCallback(
        (parameter: string, newValue: number) => {
            if(!(parameter in firstValues.current)){
                firstValues.current[parameter] = newValue;
            }
            if (timers.current[parameter]){
                clearTimeout(timers.current[parameter]);
            }
            timers.current[parameter] = setTimeout(() => {}, 800);
        },
        [workspaceId, uploadId, tab],
    ); 
}