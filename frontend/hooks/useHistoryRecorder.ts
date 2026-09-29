import { HistoryTab } from "@/types/parameterHistory";
import { useCallback,useRef } from "react";
import { historyService } from "@/services/historyServices";

export function useHistoryRecorder(
    workspaceId: string | null,
    uploadId: string,
    tab: HistoryTab,
    onRecorded?: () => void,
){
    const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
    const firstValues = useRef<Record<string, any>>({});


    return useCallback(
        (parameter: string, oldVal: any, newValue: any) => {
            if(!(parameter in firstValues.current)){
                firstValues.current[parameter] = oldVal;
            }
            if (timers.current[parameter]){
                clearTimeout(timers.current[parameter]);
            }
            timers.current[parameter] = setTimeout(() => {
                const oldVal = firstValues.current[parameter];

                delete firstValues.current[parameter];

                if(!workspaceId || oldVal === newValue) return;

                historyService
                .addEntry(workspaceId, {
                    upload_id: uploadId,
                    tab,
                    parameter,
                    old_value: oldVal,
                    new_value: newValue,
                })
                .then(() => onRecorded?.())
                .catch((err) => console.error("Failed to record history:", err));
            }, 800);
        },
        [workspaceId, uploadId, tab, onRecorded],
    ); 
}