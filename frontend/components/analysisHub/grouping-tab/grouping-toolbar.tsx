import { Button, Loader } from '@/components/ui';
import { useHdf5Data } from '@/contexts/hdf5Context/Hdf5DataContext';
import { UseCeleryPolling } from '@/hooks/useCeleryPolling';
import { ClusteringReq, ClusteringRes } from '@/types/analysis';
import { Play } from 'lucide-react';
import React from 'react'

export default function GroupingToolbar() {
  const {groupingData, setGroupingData, cpaData} = useHdf5Data()

  const {execute, isProcessing, result, error} = UseCeleryPolling<ClusteringReq, ClusteringRes>(
    "/api/py/anlysis/grouping", (job_id) =>`api/py/analysis/${job_id}`,{
    onSuccess: (data: ClusteringRes) =>{
    console.log("Grouping complete:", data)
      setGroupingData(data)
    }, onError: (error)=>{console.error("Grouping failed", error)}
    })

    const handleGroupCurrent = () => {
      if(!cpaData){
        return
      }
      if(cpaData){

        if(!cpaData.levels)
          return
        else
          execute({levels: cpaData.levels })

      }
    }

    if(groupingData)
      console.log("GROUPING IN STATE:",groupingData);
      

  


  return (
    <div className="flex items-center gap-4 h-12 px-4 border-b border-border bg-background flex-wrap">
      <h3 className="text-foreground">Grouping</h3>

      <Button
        size="sm"
        variant="primary"
        leftIcon={(isProcessing ? (<Loader size="sm" variant='dark'/>):(<Play size={14} fill="currentColor" />))}
        className="min-h-[28px] px-3"
        onClick={()=>handleGroupCurrent()}
      >
        Group Current
      </Button>
      <div className="ml-auto">
        <Button
          size="sm"
          variant="secondary"
          className="min-h-[28px] px-3"
        >
          Reset to optimal
        </Button>
      </div>
    </div>
  )
}
