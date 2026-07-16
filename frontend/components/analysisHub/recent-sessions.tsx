import {Modal} from '../ui/Modal'
import { Button } from '../ui';
import {useState} from 'react'
import { useEffect } from 'react';
import { getSessions } from '@/lib/api/sessions';
import { supabase } from '@/lib/supabase/supabaseConfig';

interface RecentSessionsProps{
    open: boolean
    onClose: () => void
}

export function RecentSessionsModal({open, onClose}:RecentSessionsProps){
    const[sessions, setSessions] = useState([])
    const[isFetching, setIsFetching] = useState(false)
    
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
                {isFetching && <p>Sessions Loading...</p>}
                {sessions.map((session) => (
                    <div key={session.id}>
                        <p>{session.created_at}</p>
                        <p>{session.user_id}</p>
                        <p>{session.name}</p>
                        <p>{session.dataset_ref}</p>
                    </div>
                ))}
            </div>
        </Modal>
    );
}