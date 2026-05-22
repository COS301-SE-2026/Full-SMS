"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";

import { SelectedFile } from "@/types/file";

type Hdf5Response = {
  metadata: {
    filename: string
    num_measurements: number
    has_spectra: boolean
    has_rasters: boolean
  }
  measurements: Array<{
    id: number
    name: string
    channelWidth: number
    description: string
  }>
}

interface Hdf5DataContextType {
  hdf5Data: Hdf5Response | null
  setHdf5Data: (data: Hdf5Response | null) => void
}

const Hdf5DataContext = createContext<Hdf5DataContextType | undefined>(undefined)

export function Hdf5DataProvider({ children }: { children: ReactNode }) {
  const [hdf5Data, setHdf5Data] = useState<Hdf5Response | null>(null)

  return (
    <Hdf5DataContext.Provider value={{ hdf5Data, setHdf5Data }}>
      {children}
    </Hdf5DataContext.Provider>
  )
}

export function useHdf5Data() {
  const ctx = useContext(Hdf5DataContext)
  if (!ctx) throw new Error("useHdf5Data must be used within Hdf5DataProvider")
  return ctx
}
