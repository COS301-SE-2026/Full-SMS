"use client";

import { Button, Toggle } from "@/components/ui";
import { useAnalysisTab } from "@/contexts/analysisTabsContext/AnalysisTabsContext";
import React, { useEffect, useState } from "react";
import { History, X } from "lucide-react";
import { getMappedIRF } from "@/services/irfServices";
import { GetMappedIRFReq, GetMappedIRFRes } from "@/types/analysis";
import { useHdf5Data } from "@/contexts/hdf5Context/Hdf5DataContext";

export default function LifetimeToolbar({
  historyOpen,
  onToggleHistory,
}: {
  historyOpen: boolean;
  onToggleHistory: () => void;
}) {
  const {
    setFittingDialogOpen,
    useLogScale,
    setUseLogScale,
    fitResult,
    showIRF,
    setShowIRF,
    setMappingDialog,
    setFitResult,
  } = useAnalysisTab();
  const {
    currentWorkspaceId,
    currentUpload,
    currentMeasurement,
    currentChannel,
    currentMappedIrf,
    setCurrentMappedIrf,
  } = useHdf5Data();

  const fetchMappedIRF = async () => {
    const payload: GetMappedIRFReq = {
      workspace_id: currentWorkspaceId!,
      dataset_ref: currentUpload,
      measurement_id: Number(currentMeasurement),
      channel: currentChannel,
    };
    const IRF: GetMappedIRFRes = await getMappedIRF(payload);
    setCurrentMappedIrf(IRF);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchMappedIRF();
  }, [currentWorkspaceId, currentUpload, currentMeasurement, currentChannel]);

  return (
    <div className="flex flex-col gap-4 h-12 px-4 border-b border-border bg-background mb-4 h-fit pb-2">
      <div>
        <div>
          <div className="flex flex-row gap-4 items-center">
            <h3 className="text-foreground">Lifetime Analysis</h3>
            <Toggle
              label="Use log scale"
              checked={useLogScale}
              onCheckedChange={setUseLogScale}
            />
            <Toggle
              label="Show IRF"
              checked={showIRF}
              onCheckedChange={setShowIRF}
            />
            <Button
              variant="primary"
              size={"sm"}
              onClick={() => setFittingDialogOpen(true)}
            >
              Fit...
            </Button>

            <Button
              variant="ghost"
              size="sm"
              title="View Parameter history"
              onClick={onToggleHistory}
              className={`ml-auto px-2 py-0.5 min-h-0 ${historyOpen ? "bg-card" : ""}`}
              leftIcon={<History size={14} />}
            />
            <Button
              className="font-black border-0 text-primary bg-primary/10"
              variant={"secondary"}
              onClick={() => {
                setMappingDialog(true);
              }}
            >
              IRF Mapping
            </Button>
          </div>
          {fitResult && (
            <div className="flex flex-wrap items-center justify-between gap-3 p-2 bg-card border border-border rounded-md mt-2">
              <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Fit:</span>
                  {fitResult.num_exponentials === 1 ? (
                    <span className="text-primary font-semibold">
                      &tau; = {fitResult.tau[0]?.toFixed(2)}
                      {fitResult.tau_std?.[0] !== undefined
                        ? ` ± ${fitResult.tau_std[0].toFixed(2)}`
                        : ""}{" "}
                      ns
                    </span>
                  ) : (
                    <div className="flex flex-wrap items-center gap-3">
                      {fitResult.tau.map((t, idx) => (
                        <span key={idx}>
                          <span className="text-primary font-semibold">
                            &tau;<sub>{idx + 1}</sub>
                          </span>{" "}
                          = {t.toFixed(2)}
                          {fitResult.tau_std?.[idx] !== undefined
                            ? ` ± ${fitResult.tau_std[idx].toFixed(2)}`
                            : ""}{" "}
                          ns
                          {fitResult.amplitude?.[idx] !== undefined && (
                            <span className="text-muted-foreground ml-1">
                              (a<sub>{idx + 1}</sub> ={" "}
                              {(fitResult.amplitude[idx] * 100).toFixed(1)}%)
                            </span>
                          )}
                        </span>
                      ))}
                      {fitResult.average_lifetime > 0 && (
                        <span className="text-primary font-semibold pl-2 border-l border-border">
                          &langle;&tau;&rangle; ={" "}
                          {fitResult.average_lifetime.toFixed(2)} ns
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Quality Badges */}
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded border ${
                      fitResult.chi_squared >= 0.8 &&
                      fitResult.chi_squared <= 1.2
                        ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/30"
                        : fitResult.chi_squared < 0.8
                          ? "text-amber-400 bg-amber-500/10 border-amber-500/30"
                          : "text-rose-400 bg-rose-500/10 border-rose-500/30"
                    }`}
                  >
                    &chi;<sup>2</sup>: {fitResult.chi_squared.toFixed(3)}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded border ${
                      fitResult.dw_bounds &&
                      fitResult.durbin_watson > fitResult.dw_bounds[1]
                        ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/30"
                        : "text-muted-foreground bg-muted/20 border-border"
                    }`}
                  >
                    DW: {fitResult.durbin_watson.toFixed(2)}
                  </span>
                </div>

                {/* Shift & Background */}
                <div className="flex items-center gap-3 text-muted-foreground">
                  <span>
                    Shift: {fitResult.shift.toFixed(2)}
                    {fitResult.shift_std
                      ? ` ± ${fitResult.shift_std.toFixed(2)}`
                      : ""}{" "}
                    ns
                  </span>
                  <span>Bg: {fitResult.background.toFixed(1)}</span>
                </div>
              </div>

              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                onClick={() => setFitResult(null as any)}
                leftIcon={<X size={12} />}
              >
                Clear
              </Button>
            </div>
          )}
        </div>
      </div>
      {currentMappedIrf && (
        <div className="">
          <span className="font-bold flex flex-row">
            <p className="text-primary"> Mapped IRF: &nbsp;</p>
            {currentMappedIrf?.name}
          </span>
        </div>
      )}
    </div>
  );
}
