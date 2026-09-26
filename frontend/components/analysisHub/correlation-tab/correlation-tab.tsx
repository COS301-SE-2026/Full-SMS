import React, {useState} from "react";
import CorrelationTabToolbar from "./correlation-tab-toolbar";
import CorrelationChart from "./correlation-chart";
import { useHdf5Data } from "@/contexts/hdf5Context/Hdf5DataContext";
import { useHistory } from "@/hooks/useHistory";
import { HistoryPanel } from "../history/HistoryPanel";
import { historyService } from "@/services/historyServices";

function CorrelationTab() {
  const [window, setWindow] = useState<number>(450);
    const [bin, setBin] = useState<number>(0.5);
    const [offset, setOffset] = useState<number>(0);

  const { currentWorkspaceId, currentUpload, currentMeasurement, setCorrelationData} = useHdf5Data();
  const {entries, loading, error, fetchHistory} = useHistory(currentWorkspaceId, currentUpload, "correlation");
  
  return (
    <div className="w-full h-full flex gap-3">
      <div className="flex flex-col flex-1">
        <CorrelationTabToolbar
          window={window} setWindow={setWindow} bin={bin} setBin={setBin} offset={offset} setOffset={setOffset} onHistoryRecorded={fetchHistory}
        />
        <CorrelationChart/>
      </div>
      <HistoryPanel
        entries={entries}
        loading={loading}
        error={error}
         onRevert={(entry) => {
          if(entry.parameter === "window") setWindow(entry.old_value);
          if(entry.parameter === "bin") setBin(entry.old_value);
          if(entry.parameter === "offset") setOffset(entry.old_value);
          historyService.revertEntry(currentWorkspaceId!, entry.id).then(fetchHistory);
         }}
      />
    </div>
  );
}

export default CorrelationTab;
