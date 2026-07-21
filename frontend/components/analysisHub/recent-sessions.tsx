import {Modal} from '../ui/Modal'
import {useState, useEffect} from 'react'
import { sessionsService } from '@/services/sessionsServices';
import { useSessionData } from '@/contexts/sessionsContext/sessionContext';
import { useAuth } from '@/contexts/authContext/AuthContext';
import { Button } from '../ui';
import { useToast } from '@/contexts/toastContext/ToastContext';
interface RecentSessionsProps{
    readonly open: boolean
    readonly onClose: () => void
}

export function RecentSessionsModal({open, onClose}:RecentSessionsProps){
    const[sessions, setSessions] = useState<any[]>([])
    const[isFetching, setIsFetching] = useState(false)
    const {setChosenSession} = useSessionData()
    const {user} = useAuth()
    const {errorToast} = useToast()
    
    const keyDown = (event: React.KeyboardEvent, session:any) => {
        if(event.key === "Enter"){
            setChosenSession(session)
            onClose()
        }
    };
    useEffect(() => {
       const processSessions = async () => {
        setIsFetching(true)
        try{
            const userId = user?.id
            if (!userId) return
            const data = await sessionsService.getSessions(userId)
            setSessions(data)
        }catch(error){
            errorToast("Failed to fetch sessions")
            console.error("Failed to fetch sessions", error)
        }finally{
            setIsFetching(false)
        }
    };
       if(open) processSessions()
    }, [open]);
    return(
        <Modal open={open} onClose={onClose}>
            <div>
                <h3>Recent Sessions</h3>
                <div className="grid grid-cols-3 border-b pb-2 mb-2 font-semibold text-sm">
                    <span>Session Name</span>
                    <span>Dataset Reference</span>
                    <span>Timestamp</span>
                </div>
                {isFetching && <p>Sessions Loading...</p>}
                {sessions.map((session) => (
                    <Button key={session.id} className="grid grid-cols-3 p-2 cursor-pointer hover:bg-sky-700 border-b text-sm w-full text-left"
                    onClick={() =>{
                        setChosenSession(session)
                        onClose()
                    }}
                    onKeyDown={(k) => keyDown(k, session)}
                    >
                        <span>{session.name}</span>
                        <span>{session.dataset_name}</span>
                        <span>{session.created_at}</span>
                        
                    </Button>
                ))}
            </div>
        </Modal>
    );
}