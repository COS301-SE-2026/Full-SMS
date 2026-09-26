import React from "react";
import CorrelationTabToolbar from "./correlation-tab-toolbar";
import Plot from "react-plotly.js";
import { Card } from "@/components/ui";
import CorrelationChart from "./correlation-chart";
import { useHdf5Data } from "@/contexts/hdf5Context/Hdf5DataContext";
import { useHistory } from "@/hooks/useHistory";

function CorrelationTab() {
  const { currentWorkspaceId, currentUpload, currentMeasurement, setCorrelationData} = useHdf5Data();
  const {entries, loading, error, fetchHistory} = useHistory(currentWorkspaceId, currentUpload, "correlation");
  
  return (
    <div className="w-full h-full flex gap-3">
      <div className="flex flex-col flex-1">
        <CorrelationTabToolbar />
        <CorrelationChart/>
      </div>
    </div>
  );
}

export default CorrelationTab;
