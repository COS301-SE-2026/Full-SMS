import { Button } from "@/components/ui";
import { useHdf5Data } from "@/contexts/hdf5Context/Hdf5DataContext";
import { UseCeleryPolling } from "@/hooks/useCeleryPolling";
import { ClusteringReq, ClusteringRes, LevelData } from "@/types/analysis";
import { useToast } from "@/contexts/toastContext/ToastContext";
import axiosInstance from "@/lib/api/axiosInstance";
import { useState } from "react";
import { CommentToolbarButtons } from "../comments/CommentToolbar";
import { Loader2 } from "lucide-react";

const GROUPING_URL = `${process.env.NEXT_PUBLIC_API_URL}/api/py/analysis/grouping`;

type ProgressStatus = {
  message: string;
  step: number;
  totalSteps: number;
};

//  single clustering job + poll until done or failed
async function runGroupingJob(
  levels: LevelData[],
  onProgress?: (status: ProgressStatus) => void
): Promise<ClusteringRes> {
  onProgress?.({ message: "Submitting grouping job...", step: 1, totalSteps: 3 });

  const { data } = await axiosInstance.post(GROUPING_URL, { levels })
  if (!data.task_id) {
    throw new Error("No task_id returned")
  }

  const statusUrl = `${GROUPING_URL}/${data.task_id}`
  onProgress?.({ message: "Analyzing level clusters...", step: 2, totalSteps: 3 });

  // poll until resolved
  while (true) {
    await new Promise((r) => setTimeout(r, 3000))
    const { data: status } = await axiosInstance.get(statusUrl)

    if (status.status === "completed") {
      onProgress?.({ message: "Finalizing results...", step: 3, totalSteps: 3 });
      return status.result
    }
    if (status.status === "failed"){
      throw new Error(status.error || "Grouping failed")
    }
    //loop again
  }
}

export default function GroupingToolbar({commentsOpen, onToggleComments, onNewComment, commentCount}: Readonly<{
  commentsOpen: boolean;
  onToggleComments: () => void;
  onNewComment: () => void;
  commentCount: number;
}>) {
  const {
    setGroupingData,
    cpaData,
    cpaResults,
    selectedMeasurements,
    setGroupingResultForMeasurement,
    isMultiChannel,
    selectedChannels
  } = useHdf5Data();
  const { errorToast } = useToast()

  const [isBatchProcessing, setIsBatchProcessing] = useState(false)
  const [batchRemaining, setBatchRemaining] = useState(0)
  const [progressStatus, setProgressStatus] = useState<ProgressStatus | null>(null)

  const { execute, isProcessing } = UseCeleryPolling<
    ClusteringReq,
    ClusteringRes
  >(
    `${process.env.NEXT_PUBLIC_API_URL}/api/py/analysis/grouping`,
    (job_id) =>
      `${process.env.NEXT_PUBLIC_API_URL}/api/py/analysis/grouping/${job_id}`,
    {
      onSuccess: (data: ClusteringRes) => {
        setGroupingData(data);
        setProgressStatus(null);
      },
      onError: () => {
        setProgressStatus(null);
      },
    },
  );

  const handleGroupCurrent = () => {
    if (!cpaData) {
      errorToast("Resolve Measurement before attempting to group");
      return;
    }
    if (cpaData) {
      if (!cpaData.levels) return;
      setProgressStatus({ message: "Preparing levels for grouping...", step: 1, totalSteps: 3 });
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
        setProgressStatus({ message: `Processing measurement ${id}...`, step: measurementIds.length - batchRemaining + 1, totalSteps: measurementIds.length });
        const result = runGroupingJob(cpaResults[id].levels!, setProgressStatus)
        setGroupingResultForMeasurement(id, result)
      }
      catch(ex){
        console.error(`Grouping failed for measurement ${id}`, ex)
        errorToast(`Grouping failed for measurement ${id}`)
      }
      setBatchRemaining(prev => prev - 1 )
    }
    setIsBatchProcessing(false)
    setProgressStatus(null)
  }

  const handleGroupSelected = async() => {
    const targets = isMultiChannel
      ? Array.from(selectedChannels)
      : Array.from(selectedMeasurements);
    if (targets.length === 0) {
      errorToast(isMultiChannel ? "No channels selected" : "No measurements selected");
      return;
    }
    const targetIds = targets.filter((id) => cpaResults[id]?.levels);

    if (targetIds.length === 0) {
      errorToast("Selected measurements have not been resolved yet")
      return
    }

    setIsBatchProcessing(true)
    setBatchRemaining(targetIds.length)

    for (const mId of targetIds) {
      try{
        setProgressStatus({ message: `Processing measurement ${mId}...`, step: targetIds.length - batchRemaining + 1, totalSteps: targetIds.length });
        const result = runGroupingJob(cpaResults[mId].levels!, setProgressStatus)
        setGroupingResultForMeasurement(mId, result)
      }
      catch(ex){
        console.error(`Grouping failed for measurement ${mId}`, ex)
        errorToast(`Grouping failed for measurement ${mId}`)
      }
      setBatchRemaining(prev => prev - 1)
    }
    setIsBatchProcessing(false)
    setProgressStatus(null)
  };
  const busy = isProcessing || isBatchProcessing

  return (
    <div className="px-4 -mx-3 -mt-3 border-b border-border bg-background">
      <div className="flex items-center gap-4 h-12 flex-wrap">
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

        <CommentToolbarButtons
          className="ml-auto"
          commentsOpen={commentsOpen}
          onToggleComments={onToggleComments}
          onNewComment={onNewComment}
          commentCount={commentCount}
        />
        {/* <div className="ml-auto">
          <Button size="sm" variant="secondary" className="min-h-[28px] px-3">
            Reset to optimal
          </Button>
        </div> */}
      </div>
      {(isProcessing || isBatchProcessing) && progressStatus && (
        <div className="flex items-center gap-2 pb-2">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          <span className="text-sm text-foreground/70">
            {progressStatus.message}
          </span>
          {isBatchProcessing && batchRemaining > 0 && (
            <span className="text-xs text-foreground/50">
              ({batchRemaining} remaining)
            </span>
          )}
        </div>
      )}
</div>
  );
}
