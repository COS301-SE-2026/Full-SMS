import axiosInstance from "@/lib/api/axiosInstance";
import { NotificationListResponse } from "@/types/notifications";

export const notificationService = {
    getNotifications: async (): Promise<NotificationListResponse> => {
        try{
            const response=await  axiosInstance.get(`/api/py/notifications`);
            return response.data;
        }catch(error: any){
            throw new Error(error.response?.data?.detail || "Failed to fetch notifications");
        }
    },
};