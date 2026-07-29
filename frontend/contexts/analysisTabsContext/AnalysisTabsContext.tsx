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
}

const AnalysisTabContext = createContext<AnalysisTabContextType | undefined> (undefined)

export function AnalysisTabProvider({children}: {readonly children: ReactNode}){
    
    const [activeTab, setActiveTab] = useState<string>("intensity")

    const contextValue = useMemo(()=>({
        activeTab,
        setActiveTab,
    }),[activeTab])

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
