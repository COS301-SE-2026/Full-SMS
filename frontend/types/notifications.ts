export interface Notification {
    id: string;
    workspace_id: string;
    recipient_id: string;
    type: "comment" | "invite";
    message: string;
    read: boolean;
    created_at: string;
}

export interface NotificationListResponse{
    success: boolean;
    notifications: Notification[];
}

export interface NotificationResponse{
    success: boolean;
    notification: Notification;
}