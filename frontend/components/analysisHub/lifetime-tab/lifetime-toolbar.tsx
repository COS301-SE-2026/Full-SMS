"use client";

import { Button, Toggle } from "@/components/ui";
import { useAnalysisTab } from "@/contexts/analysisTabsContext/AnalysisTabsContext";
import React, { useEffect } from "react";
import axios from "axios";
import { X } from "lucide-react";
import { getMappedIRF } from "@/services/irfServices";
import { GetMappedIRFReq, LifetimeRes } from "@/types/analysis";
import { useHdf5Data } from "@/contexts/hdf5Context/Hdf5DataContext";
import { useLifetimeSelection } from "@/hooks/useLifetimeSelection";
import { fitTargetKey, groupLevels, selectedGroups, selectionFitKeyPart } from "@/lib/lifetimeTargets";
import { CommentToolbarButtons } from '../comments/CommentToolbar';

// photons | time range | peak counts | channel width
function describeDecay(times: number[], counts: number[]): string | null {
  if (times.length === 0 || counts.length === 0) return null;
  let photons = 0;
  let maxCounts = 0;
  for (const c of counts) {
    photons += c;
    if (c > maxCounts) maxCounts = c;
  }
  const parts = [
    `${photons.toLocaleString()} photons`,
    `${(times[times.length - 1] - times[0]).toFixed(1)} ns range`,
    `Max: ${maxCounts.toLocaleString()} counts`,
  ];
  if (times.length > 1) parts.push(`Channel: ${(times[1] - times[0]).toFixed(3)} ns`);
  return parts.join(" | ");
}

function describeFitIrf(fit: LifetimeRes): string {
  if (fit.irf_source === "simulated") {
    const fitted = fit.fitted_irf_fwhm ? " (fitted)" : "";
    return `simulated, FWHM ${fit.irf_fwhm?.toFixed(3)} ns${fitted}`;
  }
  return fit.irf_source === "mapped" ? "mapped" : "none";
}

export default function LifetimeToolbar({
  historyOpen,
  onToggleHistory,
  commentsOpen,
  onToggleComments,
  onNewComment,
  commentCount,
}: Readonly<{
  historyOpen: boolean;
  onToggleHistory: () => void;
  commentsOpen: boolean;
  onToggleComments: () => void;
  onNewComment: () => void;
  commentCount: number;
}>) {
  const {
    setFittingDialogOpen,
    useLogScale,
    setUseLogScale,
    fitResult,
    showIRF,
    setShowIRF,
    mappingDialog,
    setMappingDialog,
    setFitResult,
    fitResultsByTarget,
    clearFitResultForTarget,
    requestFitView,
    decayTimes,
    decayCounts,
    selectedLevelIdx,
    selectedGroupIdx,
    resetSelectedLevelForViewChange,
  } = useAnalysisTab();
  
  const {
    currentWorkspaceId,
    currentUpload,
    currentMeasurement,
    currentChannel,
    currentMappedIrf,
    setCurrentMappedIrf,
    cpaData,
    groupingData,
  } = useHdf5Data();
  

  // Show only the IRF mapped to the current measurement/channel. The API answers 404 when
  // there is none (or it was cleared), so clear the name rather than keep the previous one.
  // Re-run when the mapping dialog closes, since mappings may have changed there.
  useEffect(() => {
    setCurrentMappedIrf(undefined);
    if (!currentWorkspaceId || !currentUpload || mappingDialog) return;

    let cancelled = false;
    const payload: GetMappedIRFReq = {
      workspace_id: currentWorkspaceId,
      dataset_ref: currentUpload,
      measurement_id: Number(currentMeasurement),
      channel: currentChannel,
    };
    getMappedIRF(payload)
      .then((irf) => {
        if (!cancelled) setCurrentMappedIrf(irf ?? undefined);
      })
      .catch((error) => {
        if (!axios.isAxiosError(error) || error.response?.status !== 404) {
          console.error("Failed to load mapped IRF:", error);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [currentWorkspaceId, currentUpload, currentMeasurement, currentChannel, mappingDialog, setCurrentMappedIrf]);

  useEffect(() => {
    resetSelectedLevelForViewChange();
  }, [currentUpload, currentMeasurement, currentChannel, resetSelectedLevelForViewChange]);

  const levels = cpaData?.levels ?? [];
  const groups = selectedGroups(groupingData);
  const currentFitKey = fitTargetKey(
    currentUpload,
    currentMeasurement,
    currentChannel,
    selectionFitKeyPart(levels, groups, selectedLevelIdx, selectedGroupIdx),
  );
  const currentFitResult = fitResultsByTarget[currentFitKey] ?? null;

  useEffect(() => {
    setFitResult(currentFitResult);
  }, [currentFitResult, setFitResult]);

  const { selectLevel, selectGroup } = useLifetimeSelection();

  // Dropdown values: "full", "level:<idx>", "group:<idx>"
  let selectionValue = "full";
  if (selectedGroupIdx !== null) selectionValue = `group:${selectedGroupIdx}`;
  else if (selectedLevelIdx !== null) selectionValue = `level:${selectedLevelIdx}`;
  const handleSelectionChange = (value: string) => {
    const [kind, idx] = value.split(":");
    if (kind === "group") void selectGroup(Number(idx));
    else void selectLevel(kind === "level" ? Number(idx) : null);
  };
  const decayInfo = describeDecay(decayTimes, decayCounts);

const leftBracket = "\u27e8";
const rightBracket = "\u27e9";

  return (
    <div className="flex flex-col gap-4 px-4 border-b border-border bg-background mb-4 h-fit pb-2 pt-2 -mx-3 -mt-3">
      <div>
        <div>
          <div className="flex flex-row gap-4 items-center h-12">
            <h3 className="text-foreground">Lifetime</h3>
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
              variant="secondary"
              size={"sm"}
              onClick={requestFitView}
              disabled={decayCounts.length === 0}
            >
              Fit View
            </Button>
            <Button
              variant="primary"
              size={"sm"}
              onClick={() => setFittingDialogOpen(true)}
            >
              Fit...
            </Button>

            <Button
              className="font-black border-0 text-primary bg-primary/10"
              variant={"secondary"}
              onClick={() => {
                setMappingDialog(true);
              }}
            >
              IRF Mapping
            </Button>
            
            {levels.length > 0 && (
              <div className="flex items-center gap-1.5 text-xs font-mono ml-1">
                <span className="text-muted-foreground">Decay:</span>
                <select
                  aria-label="Select level or group"
                  className="border rounded px-2 py-0.5 text-xs bg-card font-mono text-foreground"
                  value={selectionValue}
                  onChange={(e) => handleSelectionChange(e.target.value)}
                >
                  <option value="full">Full Trace</option>
                  <optgroup label="Levels">
                    {levels.map((lvl, idx) => (
                      <option key={`level-${lvl.start_index}`} value={`level:${idx}`}>
                        Level {idx + 1} ({lvl.num_photons} ph, {Math.round(lvl.intensity_cps)} cps)
                      </option>
                    ))}
                  </optgroup>
                  {groups.length > 0 && (
                    <optgroup label="Groups">
                      {groups.map((group, idx) => (
                        <option
                          key={`group-${group.group_id}`}
                          value={`group:${idx}`}
                          disabled={!groupLevels(group, levels)}
                        >
                          Group {group.group_id + 1} ({group.level_indices.length} levels, {group.total_photons} ph, {Math.round(group.intensity_cps)} cps)
                        </option>
                      ))}
                    </optgroup>
                  )}
                </select>
              </div>
            )}
            

            <CommentToolbarButtons
              className="ml-auto"
              historyOpen={historyOpen}
              onToggleHistory={onToggleHistory}
              commentsOpen={commentsOpen}
              onToggleComments={onToggleComments}
              onNewComment={onNewComment}
              commentCount={commentCount}
            />
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
                          {leftBracket}&tau;{rightBracket} ={" "}
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
                  {fitResult.irf_source !== undefined && (
                    <span>IRF: {describeFitIrf(fitResult)}</span>
                  )}
                </div>
              </div>

              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                onClick={() => {
                  clearFitResultForTarget(currentFitKey);
                  setFitResult(null);
                }}
                leftIcon={<X size={12} />}
              >
                Clear
              </Button>
            </div>
          )}
        </div>
      </div>
                  {decayInfo && (
              <span className="text-xs font-mono text-muted-foreground text-nowrap">
                {decayInfo}
              </span>
            )}
                  {currentMappedIrf && (
        <div className="">
          <span className="font-bold flex flex-row text-sm">
            <p className="text-primary text-sm"> Mapped IRF: &nbsp;</p>
            {currentMappedIrf?.name}
          </span>
        </div>
      )}
    </div>
  );
}
