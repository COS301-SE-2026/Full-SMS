import React, { Component, useState } from "react";
import { NumberField } from "../intensity-tab/analysis-toolbar";
import { Button } from "@/components/ui";
import { getCorrelationResult } from "@/services/analysisServices";
import { CorrelationReq } from "@/types/analysis";
import { useHdf5Data } from "@/contexts/hdf5Context/Hdf5DataContext";
import CorrelationTab from "./correlation-tab";

export default function CorrelationTabToolbar() {
  const [window, setWindow] = useState<number>(450);
  const [bin, setBin] = useState<number>(0);
  const [offset, setOffset] = useState<number>(0);
  const [g2AtZero, setG2AtZero] = useState<number>(0)
  const {
    currentMeasurement,
    currentUpload,
    setCorrelationData,
    correlationData,
  } = useHdf5Data();

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

  const onCorrelationClick = async () => {
    console.log("init Correlation");
    const data = await fetchCorrelationResult();
    setCorrelationData(data);
    const g2z = getG2AtZero(correlationData?.tau, correlationData?.g2)
    setG2AtZero(g2z)
    console.log(correlationData);
  };

  function getG2AtZero(
    tau?: number[],
    g2?: number[] ): number{
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

  return (
    <div className="flex flex-row items-center gap-4 h-12 px-4 border-b border-border bg-background flex-wrap">
      <h3 className="text-foreground">Correlation</h3>
      <NumberField label="Window (ns)" value={window} onChange={setWindow} />
      <NumberField label="Bin (ns)" value={bin} onChange={setBin} />
      <NumberField label="Offset (ns)" value={offset} onChange={setOffset} />
      <Button variant={"primary"} size={"sm"} onClick={onCorrelationClick}>
        Correlate
      </Button>
      <Button variant={"primary"} size={"sm"}>
        Rebin
      </Button>
      {correlationData && (
        <span className="flex flex-row text-xs gap-4">
          <p>Ch1: {correlationData.num_photons_ch1} </p>
          <p> Ch2: {correlationData.num_photons_ch2} </p>
          <p>
            {correlationData.num_events} events | {bin}ns bins{" "}
          </p>
          <p> g2(0)={g2AtZero}</p>
        </span>
      )}
    </div>
  );
}
