"use client";

import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useMemo,
  useEffect
} from "react";
import { UploadMetadata } from "@/types/hdf5";
import { ChangePointResult } from "@/types/analysis";
import { ClusteringRes } from "@/services/analysisServices";

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
  hdf5Metadata: UploadMetadata | undefined
  bin: number,
  setBin: (bin: number)=>void
  confidence: Confidence
  setConfidence: (conf: Confidence)=> void
  cpaData: ChangePointResult | undefined
  setCpaData: (data: ChangePointResult)=>void
  setCurrentWorkspaceId: (id: string)=>void,
  currentWorkspaceId: string | null
  groupingData: ClusteringRes,
  setGroupingData:(data: ClusteringRes) => void
}

const Hdf5DataContext = createContext<Hdf5DataContextType | undefined>(undefined)

export function Hdf5DataProvider({ children }: { readonly children: ReactNode }) {
  const [hdf5Data, setHdf5Data] = useState<Hdf5Response>({time_bins:[],counts:[],intensity_cps:[]})// holds data for intensity graph plotting
  const [cpaData, setCpaData] = useState<ChangePointResult>() // holds data for levlels plotting ("Resolve")
  const [hdf5Metadata, setHdf5Metadata] = useState<UploadMetadata | undefined>() // holds the metadata of an hdf5 file name, number of measurements etc
  const [isParsing, setIsParsing] = useState<boolean>(true); // boolean for when an hdf5 is being parsed through or not
  const [currentUpload, setCurrentUpload] = useState<string>("");// lets the analysis hub the current_upload id so the api knows which data to pull from the redis cache or db
  const [currentMeasurement, setCurrentMeasurement] = useState<string>("0")// holds the id of the current selected measurement in the measurementbar/tree, so the right measurement is fetched from the cache or db
  const [bin, setBin] = useState<number>(10)// set by the bin slider in the intensity toolbar, sent in the intensity analysis payload
  const [confidence, setConfidence] = useState<Confidence>(90)// set by the confidence input in the analysis toolbar, sent in the Resolve levels payload
  const [groupingData, setGroupingData] = useState<ClusteringRes>()
  const [currentWorkspaceId, setCurrentWorkspaceId] = useState<string | null>(()=>{
    if(typeof window !=='undefined')
        return localStorage.getItem("currentWorkspaceId") || null
    return null
  }) ///the id of the current workspace so the uploads associated with that workspace are fetched, or to associate a new upload with the current workspace

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
    currentWorkspaceId,
    groupingData,
    setGroupingData
  }),[hdf5Data, isParsing, hdf5Metadata, currentUpload, currentMeasurement, bin, confidence,cpaData, currentWorkspaceId, groupingData])
  
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
