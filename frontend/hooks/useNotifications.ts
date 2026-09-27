import { useCallback, useState, useEffect } from "react";
import { Notification } from "@/types/notifications";
import { notificationService } from "@/services/notificationServices";

export function useNotifications() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchNotifications = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await notificationService.getNotifications();
            setNotifications(res.notifications);
        }catch(e: any) {
            setError(e.message);
        }finally {
            setLoading(false);
        }
    }, []); 

    useEffect(() => {
        //eslint-disable-next-line react-hooks/set-state-in-effect
        fetchNotifications();
        const interval=setInterval(fetchNotifications, 30000);
       
        return () => clearInterval(interval);
    }, [fetchNotifications]);

    return {notifications, loading, error, fetchNotifications}; 
}