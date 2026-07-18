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
    setFitResult: (res: LifetimeRes) => void
}

const AnalysisTabContext = createContext<AnalysisTabContextType | undefined> (undefined)

export function AnalysisTabProvider({children}: {readonly children: ReactNode}){
    
    const [activeTab, setActiveTab] = useState<string>("intensity")
    const [fittingDialogOpen, setFittingDialogOpen] = useState<boolean>(false)
    const [showIRF, setShowIRF] = useState<boolean>(true)
    const [useLogScale, setUseLogScale] = useState<boolean>(false)
    const [decayCounts, setDecayCounts] = useState<number[]>([])
    const [decayTimes, setDecayTimes] = useState<number[]>([])
    const [fitResult, setFitResult] = useState<LifetimeRes | null>(null)

    const contextValue = useMemo(()=>({
        activeTab,
        setActiveTab,
        fittingDialogOpen,
        setFittingDialogOpen,
        showIRF,
        setShowIRF,
        useLogScale,
        setUseLogScale,
        decayCounts,
        setDecayCounts,
        setDecayTimes,
        decayTimes,
        fitResult,
        setFitResult
    }),[activeTab, fittingDialogOpen, useLogScale, decayCounts, decayTimes, fitResult])

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
