import axiosInstance from "@/lib/api/axiosInstance";
import { NotificationListResponse } from "@/types/notifications";
import { NotificationResponse } from "@/types/notifications";

export const notificationService = {
    getNotifications: async (): Promise<NotificationListResponse> => {
        try{
            const response=await  axiosInstance.get(`/api/py/notifications`);
            return response.data;
        }catch(error: any){
            throw new Error(error.response?.data?.detail || "Failed to fetch notifications");
        }
    },
    markRead: async(notificationId: string): Promise<NotificationResponse> => {
        try{
            const response = await axiosInstance.post(
                `/api/py/notifications/${notificationId}/read`,
            );
            return response.data;
        }catch(error: any){
            throw new Error(
                error.response?.data?.detail || "Failed to mark notification as read"
            );
        }
    },

    declineInvite: async(notificationId: string): Promise<NotificationResponse> => {
        try{
            const response = await axiosInstance.post(
                `/api/py/notifications/${notificationId}/decline`,
            );
            return response.data;
        }catch(error: any){
            throw new Error(
                error.response?.data?.detail || "Failed to decline invite. Try again"
            );
        }
    },
};