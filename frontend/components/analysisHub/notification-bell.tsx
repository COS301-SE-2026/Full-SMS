import {Bell} from "lucide-react";
import { Button } from "../ui";

interface NotificationBellProp{
    unreadCount: number;
    onClick:() => void;
}

export function NotificationBell({unreadCount, onClick}: NotificationBellProp){

    return(
        <div className="relative">
            <Button variant ="ghost"
                onClick={onClick}
                className="px-3 h-full text-sm text-foreground hover:bg-card rounded-sm transition-colors relative"
                >
                    <Bell size={16} />
                    {unreadCount > 0 && (
                        <span className="absolute top-0 right-0 min-w-[14px] h-[14px] px-1 rounded-full bg-red-600 text-white text-[10px] leading-[14px] text-center">
                            {unreadCount}
                        </span>
                    )}
            </Button>
        </div>
    )
}