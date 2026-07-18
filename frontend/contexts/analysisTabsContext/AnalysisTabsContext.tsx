"use client";

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
}

const AnalysisTabContext = createContext<AnalysisTabContextType | undefined> (undefined)

export function AnalysisTabProvider({children}: {readonly children: ReactNode}){
    
    const [activeTab, setActiveTab] = useState<string>("intensity")
    const [fittingDialogOpen, setFittingDialogOpen] = useState<boolean>(false)

    const contextValue = useMemo(()=>({
        activeTab,
        setActiveTab,
        fittingDialogOpen,
        setFittingDialogOpen
    }),[activeTab, fittingDialogOpen])

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
