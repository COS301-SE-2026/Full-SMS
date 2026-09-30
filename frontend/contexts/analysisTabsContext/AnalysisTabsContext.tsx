"use client";

import { LifetimeRes } from "@/types/analysis";
import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useMemo,
} from "react";

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
    showIRF: boolean
    setShowIRF: (show: boolean) => void
    irfCounts: number[]
    setIrfCounts: (counts: number[]) => void
    irfTimes: number[]
    setIrfTimes: (times: number[]) => void
    mappingDialog: boolean,
    setMappingDialog: (b: boolean) =>void
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
    const [mappingDialog, setMappingDialog] =useState<boolean>(false)
    

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
        mappingDialog, 
        setMappingDialog
    }),[activeTab, fittingDialogOpen, showIRF, irfCounts, irfTimes, useLogScale, decayCounts, decayTimes, fitResult, mappingDialog])

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
