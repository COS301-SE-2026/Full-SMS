import {Modal} from '../ui/Modal'
import {useState, useEffect} from 'react'
import { sessionsService } from '@/services/sessionsServices';
import { useSessionData } from '@/contexts/sessionsContext/sessionContext';
import { useAuth } from '@/contexts/authContext/AuthContext';
import { Button } from '../ui';
import { useToast } from '@/contexts/toastContext/ToastContext';
import { useHdf5Data } from '@/contexts/hdf5Context/Hdf5DataContext';
import { useAnalysisTab } from '@/contexts/analysisTabsContext/AnalysisTabsContext';

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
    const {setCurrentUpload, setCurrentUploadName, setBin, setConfidence, setCpaData, setGroupingData, setHdf5Data, setHdf5Metadata, setCurrentMeasurement, setCurrentWorkspaceId, setHeatMapColor, setSpectraHeatMapColor} = useHdf5Data()
    const {setActiveTab} = useAnalysisTab()
    const chooseSession = (session: any) => {
        setHdf5Data(session.results?.hdf5Data)
            setCurrentUpload(session.dataset_ref)
            setCurrentMeasurement(session.results?.currentMeasurement)
            setHdf5Metadata(session.results?.hdf5Metadata)
            setBin(session.parameters?.bin_size)
            setConfidence(session.parameters?.confidence)
            setCpaData(session.results?.levels)
            setGroupingData(session.results?.groups)
            setCurrentUploadName(session.dataset_name)
            setChosenSession(session)
            setCurrentWorkspaceId(session.results?.currentWorkspaceId)
            setActiveTab(session.results?.activeTab)
            setHeatMapColor(session.results?.heatMapColor)
            setSpectraHeatMapColor(session.results?.spectraHeatMapColor)
            onClose()
    }
    const keyDown = (event: React.KeyboardEvent, session:any) => {
        if(event.key === "Enter"){
            chooseSession(session)
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
                    
                    <span>Timestamp</span>
                </div>
                {isFetching && <p>Sessions Loading...</p>}
                {sessions.map((session) => (
                    <Button key={session.id} variant="secondary" className="grid grid-cols-3 p-2 cursor-pointer hover:ring-2 hover:ring-primary border-b text-sm w-full text-left mb-2"
                    onClick={() =>{
                        chooseSession(session)
                    }}
                    onKeyDown={(k) => keyDown(k, session)}     
                    >
                        <span>{session.name}</span>
                        
                        <span>{session.created_at}</span>
                        
                    </Button>
                ))}
            </div>
        </Modal>
    );
}