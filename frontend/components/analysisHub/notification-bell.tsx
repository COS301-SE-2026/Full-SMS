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
                        <span className="absolute top-3 right-2 min-w-[12px] h-[12px] px-0.5 rounded-full bg-red-600 text-white text-[8px] font-medium leading-[12px] text-center">
                            {unreadCount}
                        </span>
                    )}
            </Button>
        </div>
    )
}