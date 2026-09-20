import { Button, Loader } from "@/components/ui";
import { useHdf5Data } from "@/contexts/hdf5Context/Hdf5DataContext";
import { UseCeleryPolling } from "@/hooks/useCeleryPolling";
import { ClusteringReq, ClusteringRes, LevelData } from "@/types/analysis";
import { useToast } from "@/contexts/toastContext/ToastContext";
import axiosInstance from "@/lib/api/axiosInstance";
import { useState } from "react";

const GROUPING_URL = `${process.env.NEXT_PUBLIC_API_URL}/api/py/analysis/grouping`;

//  single clustering job + poll until done or failed
async function runGroupingJob(levels: LevelData[]): Promise<ClusteringRes> {
  const { data } = await axiosInstance.post(GROUPING_URL, { levels })
  if (!data.task_id) {
    throw new Error("No task_id returned")
  }

  const statusUrl = `${GROUPING_URL}/${data.task_id}`

  // poll until resolved
  while (true) {

    await new Promise((r) => setTimeout(r, 3000))
    const { data: status } = await axiosInstance.get(statusUrl)

    if (status.status === "completed") {
      return status.result
    }
    if (status.status === "failed"){
        throw new Error(status.error || "Grouping failed")
      }
    //loop again
  }
}

export default function GroupingToolbar() {
  const {
    groupingData,
    setGroupingData,
    cpaData,
    getAllResolvedLevels,
    cpaResults,
    selectedMeasurements,
    setGroupingResultForMeasurement
  } = useHdf5Data();
  const { errorToast } = useToast()
  const [isBatchProcessing, setIsBatchProcessing] = useState(false)
  const [batchRemaining, setBatchRemaining] = useState(0)
  const { execute, isProcessing, result, error } = UseCeleryPolling<
    ClusteringReq,
    ClusteringRes
  >(
    `${process.env.NEXT_PUBLIC_API_URL}/api/py/analysis/grouping`,
    (job_id) =>
      `${process.env.NEXT_PUBLIC_API_URL}/api/py/analysis/grouping/${job_id}`,
    {
      onSuccess: (data: ClusteringRes) => {
        console.log("Grouping complete:", data);
        setGroupingData(data);
      },
      onError: (error) => {
        console.error("Grouping failed", error);
      },
    },
  );

  const handleGroupCurrent = () => {
    console.log("Group current clicked");

    if (!cpaData) {
      errorToast("Resolve Measurement before attempting to group");
      return;
    }
    if (cpaData) {
      if (!cpaData.levels) return;
      else console.log("ONE LEVEL: ", cpaData.levels[0]);
      execute({ levels: cpaData.levels });
    }
  };

  const handleGroupAll = async () => {
    const measurementIds = Object.keys(cpaResults).filter(mId => cpaResults[mId]?.levels)

    if(measurementIds.length=== 0){
      errorToast("Not all measurements have been resolved")
      return
    }

    setIsBatchProcessing(true)
    setBatchRemaining(measurementIds.length)

    for( const id of measurementIds){
      try{
        const result = await runGroupingJob(cpaResults[id].levels!)
        setGroupingResultForMeasurement(id, result)
      }
      catch(ex){
        errorToast(`Grouping failed for measurement ${id}, ${ex}`)
      }
      setBatchRemaining(prev => prev - 1 )
    }
    setIsBatchProcessing(false)
  }

  const handleGroupSelected = async() => {
    if (selectedMeasurements.size === 0) {
      errorToast("No measurements selected");
      return;
    }

    const measurementIds = Array.from(selectedMeasurements).filter(mId => cpaResults[mId]?.levels)

    if (measurementIds.length === 0) {
      errorToast("Selected measurements have not been resolved yet")
      return
    }

    setIsBatchProcessing(true)
    setBatchRemaining(measurementIds.length)

    for (const mId of measurementIds) {
      try{
        const result =  await runGroupingJob(cpaResults[mId].levels! )
        setGroupingResultForMeasurement(mId, result)
      }
      catch(ex){
        errorToast(`Grouping failed for measurement ${mId}, ${ex}`)
      }
      setBatchRemaining(prev => prev - 1)
    }
    setIsBatchProcessing(false)
  };

  const busy = isProcessing || isBatchProcessing

  return (
    <div className="pb-2 px-4 border-b border-border bg-background flex-wrap">
      <div className="flex items-center gap-4 ">
        <h3 className="text-foreground">Grouping</h3>
        <Button
          size="sm"
          variant="primary"
          disabled={busy}
          className={`min-h-[28px] px-3 cursor:pointer hover:h-[20px] ${busy && "animate-pulse"}`}
          onClick={() => {
            handleGroupCurrent();
          }}
        >
          Group Current
        </Button>
        <Button
          size="sm"
          variant="primary"
          disabled={busy}
          className={`min-h-[28px] px-3 cursor:pointer hover:h-[20px] ${busy && "animate-pulse"}`}
          onClick={() => {
            handleGroupSelected();
          }}
        >
          Group Selected
        </Button>
        <Button
          size="sm"
          variant="primary"
          disabled={busy}
          className={`min-h-[28px] px-3 cursor:pointer hover:h-[20px] ${busy && "animate-pulse"}`}
          onClick={() => {
            handleGroupAll();
          }}
        >
          Group All
        </Button>
        <div className="ml-auto">
          <Button size="sm" variant="secondary" className="min-h-[28px] px-3">
            Reset to optimal
          </Button>
        </div>
      </div>
      {isBatchProcessing && (
        <span className="font-mono text-sm text-primary animate-pulse">
          Grouping {batchRemaining} measurement{batchRemaining !== 1 ? "s" : ""} …
        </span>
      )}
    </div>
    
    
  );
}
