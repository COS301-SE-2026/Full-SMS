"use client";

import { LifetimeRes } from "@/types/analysis";
import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useMemo,
    useCallback,
    useRef,
} from "react";

export type LifetimeFitDialogSettings = {
    background: boolean;
    detectEndpoint: boolean;
    startMode: string;
    useIRF: boolean;
    useSimulatedIRF: boolean;
    fitFWHM: boolean;
    scope: string;
    fitTarget: "measurement" | "selected-level" | "all-levels" | "selected-group" | "all-groups";
    numExponents: number;
    tauInit: [number, number, number];
    tauBounds: [[number, number], [number, number], [number, number]];
    shiftInit: number;
    shiftBoundsMin: number;
    shiftBoundsMax: number;
    startChannel: number;
    endChannel: number;
    backgroundValue: number;
    fhwm: number;
    fwhmBoundsMin: number;
    fwhmBoundsMax: number;
}

const DEFAULT_LIFETIME_FIT_DIALOG_SETTINGS: LifetimeFitDialogSettings = {
    background: true,
    detectEndpoint: true,
    startMode: "(Close to) max",
    useIRF: true,
    useSimulatedIRF: false,
    fitFWHM: false,
    scope: "Current",
    fitTarget: "measurement",
    numExponents: 1,
    tauInit: [5.0, 1.0, 0.1],
    tauBounds: [[0.01, 100.0], [0.01, 100.0], [0.01, 100.0]],
    shiftInit: 0,
    shiftBoundsMin: -2000,
    shiftBoundsMax: 2000,
    startChannel: 0,
    endChannel: 4096,
    backgroundValue: 0,
    fhwm: 0.1,
    fwhmBoundsMin: 0.01,
    fwhmBoundsMax: 2.0,
};

interface AnalysisTabContextType {
    activeTab: string 
    setActiveTab: (tab: string)=> void
    fittingDialogOpen: boolean
    setFittingDialogOpen:(open: boolean) => void
    useLogScale: boolean
    setUseLogScale:(log: boolean) => void
    decayCounts: number []
    setDecayCounts: (counts: number[])=>void
    decayTimes: number []
    setDecayTimes: (counts: number[])=>void
    fitResult: LifetimeRes | null,
    setFitResult: (res: LifetimeRes | null) => void
    fitResultsByTarget: Record<string, LifetimeRes>
    setFitResultsByTarget: (results: Record<string, LifetimeRes>) => void
    setFitResultForTarget: (key: string, res: LifetimeRes) => void
    clearFitResultForTarget: (key: string) => void
    fitViewRevision: number
    requestFitView: () => void
    decayLoading: boolean
    setDecayLoading: (loading: boolean) => void
    fitDialogSettings: LifetimeFitDialogSettings
    setFitDialogSettings: (settings: LifetimeFitDialogSettings) => void
    showIRF: boolean
    setShowIRF: (show: boolean) => void
    irfCounts: number[]
    setIrfCounts: (counts: number[]) => void
    irfTimes: number[]
    setIrfTimes: (times: number[]) => void
    mappingDialog: boolean,
    setMappingDialog: (b: boolean) =>void
    selectedLevelIdx : number | null
    setSelectedLevelIdx: (idx: number | null ) => void
    // Index into the groups of the selected grouping step; at most one of level/group is set
    selectedGroupIdx: number | null
    setSelectedGroupIdx: (idx: number | null) => void
    restoreSelectedLevelIdx: (idx: number | null, skipNextReset: boolean, groupIdx?: number | null) => void
    resetSelectedLevelForViewChange: () => void
}

const AnalysisTabContext = createContext<AnalysisTabContextType | undefined> (undefined)

export function AnalysisTabProvider({children}: {readonly children: ReactNode}){
    
    const [activeTab, setActiveTab] = useState<string>("intensity")
    const [fittingDialogOpen, setFittingDialogOpen] = useState<boolean>(false)
    const [showIRF, setShowIRF] = useState<boolean>(true)
    const [irfCounts, setIrfCounts] = useState<number[]>([])
    const [irfTimes, setIrfTimes] = useState<number[]>([])
    const [useLogScale, setUseLogScale] = useState<boolean>(false)
    const [decayCounts, setDecayCounts] = useState<number[]>([])
    const [decayTimes, setDecayTimes] = useState<number[]>([])
    const [fitResult, setFitResult] = useState<LifetimeRes | null>(null)
    const [fitResultsByTarget, setFitResultsByTarget] = useState<Record<string, LifetimeRes>>({})
    const [fitDialogSettings, setFitDialogSettings] = useState<LifetimeFitDialogSettings>(DEFAULT_LIFETIME_FIT_DIALOG_SETTINGS)
    const [fitViewRevision, setFitViewRevision] = useState<number>(0)
    const [decayLoading, setDecayLoading] = useState<boolean>(false)
    const [mappingDialog, setMappingDialog] =useState<boolean>(false)
    const [selectedLevelIdx, setSelectedLevelIdx] = useState<number | null>(null);
    const [selectedGroupIdx, setSelectedGroupIdx] = useState<number | null>(null);
    const skipNextSelectedLevelReset = useRef(false);

    const restoreSelectedLevelIdx = useCallback(
        (idx: number | null, skipNextReset: boolean, groupIdx: number | null = null) => {
            skipNextSelectedLevelReset.current = skipNextReset;
            setSelectedLevelIdx(idx);
            setSelectedGroupIdx(groupIdx);
        },
        [],
    );
    const resetSelectedLevelForViewChange = useCallback(() => {
        if (skipNextSelectedLevelReset.current) {
            skipNextSelectedLevelReset.current = false;
            return;
        }
        setSelectedLevelIdx(null);
        setSelectedGroupIdx(null);
    }, []);
    

    const contextValue = useMemo(()=>({
        activeTab,
        setActiveTab,
        fittingDialogOpen,
        setFittingDialogOpen,
        showIRF,
        setShowIRF,
        irfCounts,
        setIrfCounts,
        irfTimes,
        setIrfTimes,
        useLogScale,
        setUseLogScale,
        decayCounts,
        setDecayCounts,
        setDecayTimes,
        decayTimes,
        fitResult,
        setFitResult,
        fitResultsByTarget,
        setFitResultsByTarget: (results: Record<string, LifetimeRes>) => {
            setFitResultsByTarget(results)
        },
        setFitResultForTarget: (key: string, res: LifetimeRes) => {
            setFitResultsByTarget((previous) => ({ ...previous, [key]: res }))
        },
        clearFitResultForTarget: (key: string) => {
            setFitResultsByTarget((previous) => {
                if (!(key in previous)) return previous
                const { [key]: _removed, ...rest } = previous
                return rest
            })
        },
        fitViewRevision,
        requestFitView: () => setFitViewRevision((revision) => revision + 1),
        decayLoading,
        setDecayLoading,
        fitDialogSettings,
        setFitDialogSettings,
        mappingDialog, 
        setMappingDialog,
        selectedLevelIdx,
        setSelectedLevelIdx,
        selectedGroupIdx,
        setSelectedGroupIdx,
        restoreSelectedLevelIdx,
        resetSelectedLevelForViewChange
    }),[activeTab, fittingDialogOpen, showIRF, irfCounts, irfTimes, useLogScale, decayCounts, decayTimes, fitResult, fitResultsByTarget, fitViewRevision, decayLoading, fitDialogSettings, mappingDialog, selectedLevelIdx, selectedGroupIdx, restoreSelectedLevelIdx, resetSelectedLevelForViewChange])

    return (
        <AnalysisTabContext.Provider value={contextValue}>
            {children}
        </AnalysisTabContext.Provider>
    )
}

export function useAnalysisTab(){
    const ctx = useContext(AnalysisTabContext)
    if(!ctx)
        throw new Error("useAnalysis tab must be used wihtin AnalysisTabProvider")
    return ctx
}
