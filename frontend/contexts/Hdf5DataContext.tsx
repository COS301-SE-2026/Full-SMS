"use client";

import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useMemo,
} from "react";
import { UploadMetadata, UploadResultRecord } from "@/types/hdf5";
import { string } from "yup";

// class IntensityRes(BaseModel):
//     time_bins: List[float]       # X-axis ( time in milliseconds)
//     counts: List[int]            # Y-axis (Raw photon counts per bin)
//     intensity_cps: List[float]

type Hdf5Response = {
  time_bins: number[],
  counts: number[],
  intensity_cps: number[]
}

interface Hdf5DataContextType {
  hdf5Data: Hdf5Response
  setHdf5Data: (data: Hdf5Response) => void
  isParsing: boolean
  setIsParsing: (is_parsing: boolean) => void
  currentUpload: string
  setCurrentUpload: (upload_id: string)=> void
  currentMeasurement: string,
  setCurrentMeasurement: (measurement_id: string) => void,
  setHdf5Metadata: (metadata: UploadMetadata)=> void,
  hdf5Metadata: UploadMetadata
  bin: number,
  setBin: (bin: number)=>void
}

const Hdf5DataContext = createContext<Hdf5DataContextType | undefined>(undefined)

export function Hdf5DataProvider({ children }: { children: ReactNode }) {
  const [hdf5Data, setHdf5Data] = useState<Hdf5Response>({time_bins:[],counts:[],intensity_cps:[]})
  const [hdf5Metadata, setHdf5Metadata] = useState()
  const [isParsing, setIsParsing] = useState<boolean>(true);
  const [currentUpload, setCurrentUpload] = useState<string>("");
  const [currentMeasurement, setCurrentMeasurement] = useState<string>("1")
  const [bin, setBin] = useState<number>(10)

  const contextValue = useMemo(()=>({
    hdf5Data, 
    setHdf5Data, 
    isParsing, 
    setIsParsing, 
    setCurrentUpload, 
    currentUpload,
    setCurrentMeasurement,
    currentMeasurement,
    hdf5Metadata,
    setHdf5Metadata,
    bin,
    setBin
  }),[hdf5Data, isParsing, hdf5Metadata, currentUpload, currentMeasurement, bin])
  
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
