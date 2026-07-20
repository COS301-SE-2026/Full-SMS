'use client';


import {FileText} from 'lucide-react';
import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils';
import { UploadMetadata, UploadResultRecord } from '@/types/hdf5';
import { useHdf5Data } from '@/contexts/hdf5Context/Hdf5DataContext'
import { getHdf5UploadResult } from '@/services/hdf5services';
import { Intensity_Req } from '@/types/analysis';
import { intensityAnalysis } from '@/services/analysisServices';
import { Button, Checkbox} from '@/components/ui';

export interface Measurement{
name: string
checked?:boolean
}

export function MeasurementsBar() {
  const [num_measurements, setNum_measurements] = useState<number>(0)
  const {currentMeasurement, setCurrentMeasurement, currentUpload, setHdf5Data, bin, selectedMeasurements, toggleSelectedmeasurement, selectAllmeasurements, clearSelectedMeasurements,} = useHdf5Data();
  const fetchUploadResult = async ()=>{
      if(currentUpload){
        console.log("CURRENT UPLOAD:", currentUpload);
        const response: UploadResultRecord = await getHdf5UploadResult(currentUpload)
        return response}

    }
  
  const fetchIntensityTrace= async ()=>{
      if(currentUpload){
        const request: Intensity_Req ={
        upload_id:currentUpload,
        measurement_id:currentMeasurement,
        bin_size_ms: Number(bin),
      }
      const response = await intensityAnalysis(request)
      setHdf5Data(response)
      }

    }
  
  
    useEffect(()=>{
      fetchIntensityTrace()
      },[currentMeasurement, bin, currentUpload]);

    useEffect(()=>{
      const loadData = async () => {
        try {
          const record = await fetchUploadResult();
          if(record){
          const metadata: UploadMetadata = record.metadata_json;
          setNum_measurements(metadata.num_measurements)}
        } catch (error) {
          console.error("Failed to fetch or parse upload result:", error);
        }
      };
  
      loadData();
    },[currentUpload])

    

  const measurements: Measurement[] = []
  
  for(let i: number =1; i <= num_measurements; i++){
    const element:Measurement ={name: `Measurement ${i}`,checked:i==1}
    measurements.push(element)
  }



  const onClickMeasurement = (id: number) => {
    setCurrentMeasurement((id+1).toString())
  }

  return (
    <div className="flex flex-col border-t border-border overflow-hidden">
      <div className="mt-3 px-3.5 flex items-center justify-between">
        <span className="text-xs text-foreground/60 tracking-wider">MEASUREMENTS</span>
        <div className='flex items-center gap-1'>
          <Button variant="ghost" size="sm" 
            onClick={() => selectAllmeasurements(num_measurements)}>
            All
          </Button>
          <Button variant="ghost" size="sm" onClick={clearSelectedMeasurements}>
            Clear
          </Button>
        </div>
      </div>

      <div className="flex flex-col mt-1 overflow-y-auto flex-1">
        {measurements.map((m, i) =>{
          const measurementID= (i+1).toString()
          const currentM = measurementID === currentMeasurement
          const MultiSelected = selectedMeasurements.has(measurementID)
        
        
         return(
          <div key={m.name} className={cn("flex items-center gap - 1.5 px-3.5 py-1", currentM ? "bg-card" : "")}>
            <Checkbox checked={MultiSelected}
              onCheckedChange={()=> toggleSelectedmeasurement(measurementID)}
              onClick={(e) => e.stopPropagation()} 
            />
            <button 
            className="flex items-center gap-1.5 px-3.5 py-1 hover:bg-card cursor-pointer"
            onClick={()=>onClickMeasurement(i)}
            >

              <FileText size={12} className="text-foreground/70" />
              <span
                className={cn(
                  'text-xs truncate',
                  currentM ? 'text-primary' : 'text-foreground'
                )}
              >
                {m.name}
              </span>
            </button>
          </div>
        )}
        )}
      </div>
      <p className="px-3.5 py-1.5 text-[11px] text-foreground/50">
        {selectedMeasurements.size} selected
      </p>
    </div>
  )
}

