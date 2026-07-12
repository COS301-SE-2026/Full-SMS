"use client";

import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useMemo,
  useEffect
} from "react";
import { UploadMetadata, UploadResultRecord } from "@/types/hdf5";
import { ChangePointResult } from "@/types/intensity";

// class IntensityRes(BaseModel):
//     time_bins: List[float]       # X-axis ( time in milliseconds)
//     counts: List[int]            # Y-axis (Raw photon counts per bin)
//     intensity_cps: List[float]

type Hdf5Response = {
  time_bins: number[],
  counts: number[],
  intensity_cps: number[]
}

type Confidence = 69 | 90 | 95 | 99

interface Hdf5DataContextType {
  hdf5Data: Hdf5Response | undefined
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
  confidence: Confidence
  setConfidence: (conf: Confidence)=> void
  cpaData: ChangePointResult | undefined
  setCpaData: (data: ChangePointResult)=>void
  setCurrentWorkspaceId: (id: string)=>void,
  currentWorkspaceId: string
}

const Hdf5DataContext = createContext<Hdf5DataContextType | undefined>(undefined)

export function Hdf5DataProvider({ children }: { children: ReactNode }) {
  const [hdf5Data, setHdf5Data] = useState<Hdf5Response>({time_bins:[],counts:[],intensity_cps:[]})
  const [cpaData, setCpaData] = useState<ChangePointResult>()
  const [hdf5Metadata, setHdf5Metadata] = useState()
  const [isParsing, setIsParsing] = useState<boolean>(true);
  const [currentUpload, setCurrentUpload] = useState<string>("70cc3a45-de95-4e27-8f5f-3907aaa13b54");
  const [currentMeasurement, setCurrentMeasurement] = useState<string>("0")
  const [bin, setBin] = useState<number>(10)
  const [confidence, setConfidence] = useState<Confidence>(90)
  const [currentWorkspaceId, setCurrentWorkspaceId] = useState<string>("")

  useEffect(() => {
    const savedWorkspaceId = localStorage.getItem("currentWorkspaceId");
    if (savedWorkspaceId) {
      setCurrentWorkspaceId(savedWorkspaceId);
    }
  }, []);

  useEffect(() => {
    if (currentWorkspaceId) {
      localStorage.setItem("currentWorkspaceId", currentWorkspaceId);
    } else {
      localStorage.removeItem("currentWorkspaceId");
    }
  }, [currentWorkspaceId]);


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
    setBin,
    confidence, 
    setConfidence,
    setCpaData,
    cpaData,
    setCurrentWorkspaceId,
    currentWorkspaceId
  }),[hdf5Data, isParsing, hdf5Metadata, currentUpload, currentMeasurement, bin, confidence,cpaData, currentWorkspaceId])
  
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
