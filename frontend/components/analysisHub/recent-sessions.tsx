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
    const {currentUpload, currentMeasurement, currentChannel, setCurrentUpload, setCurrentUploadName, setBin, setConfidence, restoreCpaResultsForSession, setHdf5Data, setHdf5Metadata, setCurrentMeasurement, setCurrentChannel, setCurrentWorkspaceId, setHeatMapColor, setSpectraHeatMapColor} = useHdf5Data()
    const {setActiveTab, setFitResult, setFitResultsByTarget, restoreSelectedLevelIdx} = useAnalysisTab()
    const chooseSession = (session: any) => {
        const savedChannel = session.results?.currentChannel ?? 1
        const savedMeasurement = session.results?.currentMeasurement ?? "0"
        const savedLevelIdx = session.results?.selectedLevelIdx ?? null
        const savedGroupIdx = session.results?.selectedGroupIdx ?? null
        const legacyFit = session.results?.fits
        const legacyFitKey = session.results?.currentFitKey ??
            `${session.dataset_ref}:${savedMeasurement}:${savedChannel}:full`
        const restoredFits = session.results?.fitResultsByTarget
        const fitMap = restoredFits && typeof restoredFits === "object"
            ? restoredFits
            : legacyFit
                ? {[legacyFitKey]: legacyFit}
                : {}
        const metadata = session.results?.hdf5Metadata
        const isMultiChannel = metadata?.measurements_summary?.some(
            (measurement: {channels?: string[]}) => (measurement.channels?.length ?? 0) > 1,
        ) ?? false
        const legacyCpaKey = isMultiChannel
            ? `${savedMeasurement}:${savedChannel}`
            : savedMeasurement
        const restoredCpaResults = session.results?.cpaResults ?? (
            session.results?.levels
                ? {[legacyCpaKey]: session.results.levels}
                : {}
        )
        // Older sessions only saved the open measurement's grouping as "groups"
        const restoredGroupingResults = session.results?.groupingResults ?? (
            session.results?.groups
                ? {[legacyCpaKey]: session.results.groups}
                : {}
        )

        setHdf5Data(session.results?.hdf5Data)
            setCurrentUpload(session.dataset_ref)
            setCurrentMeasurement(savedMeasurement)
            setCurrentChannel(savedChannel)
            setHdf5Metadata(session.results?.hdf5Metadata)
            setBin(session.parameters?.bin_size)
            setConfidence(session.parameters?.confidence)
            restoreCpaResultsForSession(session.dataset_ref, restoredCpaResults, restoredGroupingResults)
            setCurrentUploadName(session.dataset_name)
            setChosenSession(session)
            setCurrentWorkspaceId(session.results?.currentWorkspaceId)
            setActiveTab(session.results?.activeTab)
            setFitResultsByTarget(fitMap)
            setFitResult(legacyFit ?? null)
            restoreSelectedLevelIdx(
                savedLevelIdx,
                session.dataset_ref !== currentUpload ||
                    savedMeasurement !== currentMeasurement ||
                    savedChannel !== currentChannel,
                savedGroupIdx,
            )
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
            const data = await sessionsService.getSessions()
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