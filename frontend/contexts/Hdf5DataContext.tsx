"use client";

import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useMemo,
} from "react";


type Hdf5Response = {
  metadata?: {
    filename: string
    num_measurements: number
    has_spectra: boolean
    has_rasters: boolean
  }
  measurements?: Array<{
    id: number
    name: string
    channelWidth: number
    description: string
  }>
}

interface Hdf5DataContextType {
  hdf5Data: Hdf5Response | null
  setHdf5Data: (data: Hdf5Response | null) => void
  isParsing: boolean
  setIsParsing: (is_parsing: boolean) => void
}

const Hdf5DataContext = createContext<Hdf5DataContextType | undefined>(undefined)

export function Hdf5DataProvider({ children }: { children: ReactNode }) {
  const [hdf5Data, setHdf5Data] = useState<Hdf5Response | null>(null)
  const [isParsing, setIsParsing] = useState<boolean>(true);
  console.log(hdf5Data);
  
  const contextValue = useMemo(()=>({
    hdf5Data, setHdf5Data, isParsing, setIsParsing 
  }),[hdf5Data, isParsing])
  
  return (
    <Hdf5DataContext.Provider value={contextValue}>
      {children}
    </Hdf5DataContext.Provider>
  )
}

export function useHdf5Data() {
  const ctx = useContext(Hdf5DataContext)
  if (!ctx) throw new Error("useHdf5Data must be used within Hdf5DataProvider")
  return ctx
}
