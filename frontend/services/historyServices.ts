import axiosInstance from "@/lib/api/axiosInstance";
import { HistoryListResponse, HistoryTab, HistoryEntryResponse, AddHistory,} from "@/types/parameterHistory";

export const historyService = {
    getHistory: async(
        workspaceId: string,
        uploadId: string,
        tab: HistoryTab,
    ): Promise<HistoryListResponse> => {
        try {
            const response = await axiosInstance.get (
                `/api/py/workspaces/${workspaceId}/history`,
                { params:{ upload_id: uploadId, tab}},
            );

            return response.data;
        }catch (error: any) {
            throw new Error(
                error.response?.data?.detail || "Failed to fetch history"
            );
        }
    },

    addEntry: async(
        workspaceId: string,
        request: AddHistory,
    ): Promise<HistoryEntryResponse> => {
        try {
            const response = await axiosInstance.post (
                `/api/py/workspaces/${workspaceId}/history`,
                request,
            );

            return response.data;
        }catch (error: any) {
            throw new Error(
                error.response?.data?.detail || "Failed to record change"
            );
        }
    },
    
};