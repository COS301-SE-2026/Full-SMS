"use client"

import{
    createContext,
    useContext,
    useState,
    ReactNode,
    useMemo,
} from "react"

type sessionRow = {
    id: string
    created_at: string
    user_id: string
    name: string
    dataset_ref: string
    parameters: any
    results: any
        
}

interface SessionContextType{
    readonly chosenSession: sessionRow | null
    readonly setChosenSession: (session:sessionRow | null) => void
}

const sessionContext = createContext<SessionContextType | undefined>(undefined)

export function SessionDataProvider({children}: {children: ReactNode}){
    const [sessionData, setSessionData] = useState<sessionRow | null>(null)
    const value = useMemo(
        () => ({chosenSession: sessionData, setChosenSession: setSessionData}),
        [sessionData, setSessionData]
    )
    return(
        <sessionContext.Provider value = {value}>
            {children}
        </sessionContext.Provider>
    )
}

export function useSessionData(){
    const ctx = useContext(sessionContext)
    if(!ctx) {
        throw new Error("useSessionData must be used within sessionDataProvider")
    }
    return ctx
}