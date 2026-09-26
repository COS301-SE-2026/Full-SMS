import React, { useState } from "react";
import { NumberField } from "../intensity-tab/analysis-toolbar";
import { Button } from "@/components/ui";
import {
  getCorrelationResult,
  getRebinCorrelationResult,
} from "@/services/analysisServices";
import { CorrelationReq, RebinCorrelationReq } from "@/types/analysis";
import { useHdf5Data } from "@/contexts/hdf5Context/Hdf5DataContext";
import { useToast } from "@/contexts/toastContext/ToastContext";
import { useHistoryRecorder } from "@/hooks/useHistoryRecorder";

function getG2AtZero(tau?: number[], g2?: number[]): number {
    if (!tau?.length || !g2?.length) {
      return 0;
    }
    let minDiff = Infinity;
    let zeroIdx = 0;
    for (let i = 0; i < tau.length; i++) {
      const diff = Math.abs(tau[i]);

      if (diff < minDiff) {
        minDiff = diff;
        zeroIdx = i;
        if (diff === 0) break;
      }
    }
    return g2[zeroIdx] ?? 0;
  }

export default function CorrelationTabToolbar({
  window, setWindow, bin, setBin, offset, setOffset,onHistoryRecorded
}: {
  window: number; setWindow: (v:number) => void;
  bin: number; setBin: (v:number) => void;
  offset: number; setOffset: (v:number) => void;
  onHistoryRecorded: () =>void;
}) {
  
  const [g2AtZero, setG2AtZero] = useState<number>(0);
  const { successToast, errorToast } = useToast();
  const {
    currentMeasurement,
    currentUpload,
    setCorrelationData,
    correlationData,
    hdf5Metadata,
    currentWorkspaceId
  } = useHdf5Data();

  const recordHist = useHistoryRecorder(currentWorkspaceId, currentUpload, "correlation", onHistoryRecorded);

  const fetchCorrelationResult = async () => {
    const payload: CorrelationReq = {
      upload_id: currentUpload,
      measurement_id: currentMeasurement,
      window_ns: window,
      binsize_ns: bin,
      difftime_ns: offset,
    };
    
    
    const response = await getCorrelationResult(payload);
    return response;
  };

  const fetchRebinResult = async () => {
    if (correlationData?.measurement_id === currentMeasurement) {
      const payload: RebinCorrelationReq = {
        result: correlationData,
        new_window_ns: window,
        new_binsize_ns: bin,
      };

      const response = await getRebinCorrelationResult(payload);
      return response;
    } else {
      errorToast("Please run a correlation before rebinning");
    }
  };

  const onCorrelationClick = async () => {
    console.log("init Correlation");
    const data = await fetchCorrelationResult();
    setCorrelationData(data);
    const g2z = getG2AtZero(correlationData?.tau, correlationData?.g2);
    setG2AtZero(g2z);
    console.log(correlationData);
    successToast("Correlation complete");
  };

  const onRebinClick = async () => {
    console.log("init rebin");
    const data = await fetchRebinResult();
    if (data) setCorrelationData(data);
  };
  
  const summary = hdf5Metadata?.measurements_summary?.filter((sum)=>(sum.id).toString()=== currentMeasurement)
  const dualChannel = (summary?.[0]?.channels?.length ?? 0) > 1;


  return (
    <div className="flex flex-row justify-between items-center gap-4 h-12 px-4 border-b border-border bg-background flex-wrap">
      <div className="flex flex-row items-center gap-4">
        <h3 className="text-foreground">Correlation</h3>
        <NumberField label="Window (ns)" value={window} onChange={(v) => {setWindow(v); recordHist("window", window, v); }} slider={false}/>
        <NumberField label="Bin (ns)" value={bin} onChange={(v) => {setBin(v); recordHist("bin", bin, v); }} slider={false}/>
        <NumberField label="Offset (ns)" value={offset} onChange={(v) => {setOffset(v); recordHist("offset", offset, v); }} slider={false}/>
        <Button variant={"primary"} size={"sm"} onClick={onCorrelationClick} disabled={!dualChannel}>
          Correlate
        </Button>
        <Button variant={"primary"} size={"sm"} onClick={onRebinClick} disabled={!dualChannel}>
          Rebin
        </Button>
      </div>
      {correlationData && (
        <span className="flex flex-row text-xs gap-4 divide-x">
          <div className="flex flex-col gap-2 px-2">
            <p>Ch1: {correlationData.num_photons_ch1} </p>
            <p> Ch2: {correlationData.num_photons_ch2} </p>
          </div>
          <div className="flex flex-col gap-2 px-2">
            <p>{correlationData.window_ns}ns window</p>
            <p>{correlationData.binsize_ns}ns bins</p>
          </div>
          <div className="flex flex-col gap-2 px-2">
            <p>{correlationData.num_events} events</p>
            <p> g2(0)={g2AtZero}</p>
          </div>
        </span>
      )}
    </div>
  );
}
