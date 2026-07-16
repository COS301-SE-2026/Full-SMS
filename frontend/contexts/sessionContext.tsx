"use client"

import{
    createContext,
    useContext,
    useState,
    ReactNode,
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

interface sessionContextType{
    chosenSession: sessionRow | null
    setChosenSession: (session:sessionRow | null) => void
}

const sessionContext = createContext<sessionContextType | undefined>(undefined)

export function SessionDataProvider({children}: {children: ReactNode}){
    const [sessionData, setSessionData] = useState<sessionRow | null>(null)

    return(
        <sessionContext.Provider value = {{chosenSession:sessionData, setChosenSession:setSessionData}}>
            {children}
        </sessionContext.Provider>
    )
}

export function useSessionData(){
    const ctx = useContext(sessionContext)
    if(!ctx) throw new Error("useSessionData must be used within sessiondataprovider")
        return ctx
}