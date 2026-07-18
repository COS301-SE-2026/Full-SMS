import {Modal} from '../ui/Modal'
import {useState, useEffect} from 'react'
import { getSessions } from '@/lib/api/sessions'; 
import { supabase } from '@/lib/supabase/supabaseConfig';
import { useSessionData } from '@/contexts/sessionContext';

interface RecentSessionsProps{
    readonly open: boolean
    readonly onClose: () => void
}

export function RecentSessionsModal({open, onClose}:RecentSessionsProps){
    const[sessions, setSessions] = useState([])
    const[isFetching, setIsFetching] = useState(false)
    const {setChosenSession} = useSessionData()
    useEffect(() => {
       const processSessions = async () => {
        setIsFetching(true)
        const user = await supabase.auth.getUser()
        const userId = user.data.user?.id
        if (!userId) return
        const data = await getSessions(userId)
        setSessions(data)
        setIsFetching(false)
       }
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
                    <div role="button" tabIndex={0} onKeyDown={(k) => keyDown(k, session)} key={session.id} className="grid grid-cols-3 p-2 cursor-pointer hover:bg-sky-700 border-b text-sm" onClick={() =>{
                        setChosenSession(session)
                        onClose()
                    }}
                    
                    >
                        <span>{session.name}</span>
                        <span>{session.dataset_ref}</span>
                        <span>{session.created_at}</span>
                        
                    </div>
                ))}
            </div>
        </Modal>
    );
}