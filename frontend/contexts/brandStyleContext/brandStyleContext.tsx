"use client";

import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useMemo,
} from "react";

interface BrandStyleType {
    activeTab: string 
    setActiveTab: (tab: string)=> void
}

const BrandStyle = createContext<BrandStyleType | undefined> (undefined)

export function BrandStyleProvider({children}: {readonly children: ReactNode}){
    
    const [activeTab, setActiveTab] = useState<string>("colors")

    const contextValue = useMemo(()=>({
        activeTab,
        setActiveTab,
    }),[activeTab])

    return (
        <BrandStyle.Provider value={contextValue}>
            {children}
        </BrandStyle.Provider>
    )
}

export function useBrandStyle(){
    const ctx = useContext(BrandStyle)
    if(!ctx)
        throw new Error("useAnalysis tab must be used wihtin AnalysisTabProvider")
    return ctx
}
