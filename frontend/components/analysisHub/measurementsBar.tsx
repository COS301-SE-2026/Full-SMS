'use client';


import {  ChevronDown,
  ChevronRight,
  FileText,
  Radio,
} from 'lucide-react';
import { use, useEffect, useMemo, useState } from 'react'
import { cn } from '@/lib/utils';
import { UploadMetadata, UploadResultRecord } from '@/types/hdf5';
import { useHdf5Data } from '@/contexts/Hdf5DataContext'
import { Loader } from '../ui';
import { getHdf5UploadResult } from '@/services/hdf5services';

export interface Measurement{
name: string
checked?:boolean
}

export function MeasurementsBar() {
  const [measurementItems, setMeasurementItems] = useState <Measurement[]>()
  const [state, setState] = useState<Record<string, { checked: boolean; expanded: boolean }>>({})
  const [num_measurements, setNum_measurements] = useState<number>(0)
  const {currentMeasurement, setCurrentMeasurement} = useHdf5Data();
  const fetchUploadResult = async ()=>{
      const response: UploadResultRecord = await getHdf5UploadResult("70cc3a45-de95-4e27-8f5f-3907aaa13b54")
      console.log(response)
      return response
    }
  
  const x = 1
    useEffect(()=>{
      const loadData = async () => {
        try {
          const record = await fetchUploadResult();
          const metadata: UploadMetadata = record.metadata_json;
          setNum_measurements(metadata.num_measurements)
        } catch (error) {
          console.error("Failed to fetch or parse upload result:", error);
        }
      };
  
      loadData();
    },[x])

    

  var measurements: Measurement[] = []
  
  for(let i: number =1; i <= num_measurements; i++){
    const element:Measurement ={name: `Measurement ${i}`,checked:i==1}
    measurements.push(element)
  }

  const toggleCheck = (i: number) => {
    const name = measurements[i]?.name
    if (!name) return
    setState((prev) => ({
      ...prev,
      [name]: { checked: !prev[name]?.checked, expanded: prev[name]?.expanded ?? false },
    }))
  }

  const toggleExpand = (i: number) => {
    const name = measurements[i]?.name
    if (!name) return
    setState((prev) => ({
      ...prev,
      [name]: { checked: prev[name]?.checked ?? false, expanded: !prev[name]?.expanded },
    }))
  }

  const onClickMeasurement = (id: number) => {
    setCurrentMeasurement((id+1).toString())
  }

  return (
    <div className="flex flex-col border-t border-border overflow-hidden">
      <div className="mt-3 px-3.5 flex items-center justify-between">
        <span className="text-xs text-foreground/60 tracking-wider">MEASUREMENTS</span>
        <button className="text-xs text-foreground/60 hover:text-primary">All</button>
      </div>
      <div className="flex flex-col mt-1 overflow-y-auto flex-1">
        {measurements.map((m, i) => (
          <div key={i}>
            <div 
            className="flex items-center gap-1.5 px-3.5 py-1 hover:bg-card cursor-pointer"
            onClick={()=>onClickMeasurement(i)}
            >
              <input
                type="checkbox"
                checked={m.checked}
                onChange={() => toggleCheck(i)}
                className="accent-primary w-3 h-3"
              />
              <FileText size={12} className="text-foreground/70" />
              <span
                className={cn(
                  'text-xs truncate',
                  m.checked ? 'text-primary' : 'text-foreground', (i+1).toString()===currentMeasurement ? "bg-primary" : ""
                )}
              >
                {m.name}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

