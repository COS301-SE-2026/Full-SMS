"use client";

import { Button, Card, CardContent, CardFooter, Toggle } from "@/components/ui";
import React, { useState, useRef } from "react";
import { useHdf5Data } from "@/contexts/hdf5Context/Hdf5DataContext";
import { useAnalysisTab } from "@/contexts/analysisTabsContext/AnalysisTabsContext";
import { LifetimeReq, LifetimeRes, LevelData, StartpointMode } from "@/types/analysis";
import { getFluorescenceDecay, getLifetimeData } from "@/services/analysisServices";
import { useHistoryRecorder } from "@/hooks/useHistoryRecorder";
import { useToast } from "@/contexts/toastContext/ToastContext";

type FitTargetKind = "measurement" | "selected-level" | "all-levels";
type FitCurveTarget = {
  measurementId: string;
  channel: number;
  level?: LevelData;
  levelIndex?: number;
};
type FitOptions = {
  uploadId: string;
  bin: number;
  useIRF: boolean;
  numExponents: number;
  tauInit: number[];
  tauBounds: [number, number];
  autostart: StartpointMode;
  autoend: boolean;
  start: number | null;
  end: number | null;
  background: number | null;
  shiftInit: number;
  shiftBounds: [number, number];
  fitIrfFwhm: boolean;
  irfFwhmInit: number | null;
  irfFwhmBounds: [number, number] | null;
};
type FitOutcome = { target: FitCurveTarget; result: LifetimeRes | null };

function createFitOptions(values: {
  uploadId: string;
  bin: number;
  useIRF: boolean;
  useSimulatedIRF: boolean;
  fitFWHM: boolean;
  numExponents: number;
  tauInit: number[];
  boundsMin: number;
  boundsMax: number;
  startMode: string;
  detectEndpoint: boolean;
  startChannel: number;
  endChannel: number;
  background: boolean;
  backgroundValue: number;
  shiftInit: number;
  shiftBoundsMin: number;
  shiftBoundsMax: number;
  fhwm: number;
  fwhmBoundsMin: number;
  fwhmBoundsMax: number;
}): FitOptions {
  const fitIrfFwhm = values.useIRF && values.useSimulatedIRF && values.fitFWHM;
  return {
    uploadId: values.uploadId,
    bin: values.bin,
    useIRF: values.useIRF,
    numExponents: values.numExponents,
    tauInit: values.tauInit,
    tauBounds: [values.boundsMin, values.boundsMax],
    autostart: mapStartMode(values.startMode),
    autoend: values.detectEndpoint,
    start: values.startMode === "Manual" ? values.startChannel : null,
    end: values.detectEndpoint ? null : values.endChannel,
    background: values.background ? null : values.backgroundValue,
    shiftInit: values.shiftInit,
    shiftBounds: [values.shiftBoundsMin, values.shiftBoundsMax],
    fitIrfFwhm,
    irfFwhmInit: fitIrfFwhm ? values.fhwm : null,
    irfFwhmBounds: fitIrfFwhm
      ? [values.fwhmBoundsMin, values.fwhmBoundsMax]
      : null,
  };
}

async function executeFitTargets(
  targets: FitCurveTarget[],
  options: FitOptions,
): Promise<FitOutcome[]> {
  return Promise.all(
    targets.map(async (target) => {
      try {
        return { target, result: await fitCurveTarget(target, options) };
      } catch (error) {
        console.error(`Lifetime fit failed for ${getTargetLabel(target)}`, error);
        return { target, result: null };
      }
    }),
  );
}

function storeFitOutcomes(
  outcomes: FitOutcome[],
  values: {
    uploadId: string;
    currentMeasurement: string;
    currentChannel: number;
    selectedLevelIdx: number | null;
    setFitResult: (result: LifetimeRes) => void;
    setFitResultForTarget: (key: string, result: LifetimeRes) => void;
  },
): string[] {
  const failures: string[] = [];
  for (const { target, result } of outcomes) {
    if (!result) {
      failures.push(getTargetLabel(target));
      continue;
    }
    const levelKey = target.level
      ? `${target.level.start_index}-${target.level.end_index}`
      : "full";
    const resultKey = `${values.uploadId}:${target.measurementId}:${target.channel}:${levelKey}`;
    values.setFitResultForTarget(resultKey, result);

    const matchesCurrentView =
      target.measurementId === values.currentMeasurement &&
      target.channel === values.currentChannel &&
      (target.levelIndex ?? null) === values.selectedLevelIdx;
    if (matchesCurrentView) values.setFitResult(result);
  }
  return failures;
}

function mapStartMode(mode: string): StartpointMode {
  switch (mode) {
    case "Manual":
      return StartpointMode.MANUAL;
    case "Rise middle":
      return StartpointMode.RISE_MIDDLE;
    case "Rise start":
      return StartpointMode.RISE_START;
    case "Safe rise start":
      return StartpointMode.SAFE_RISE_START;
    default:
      return StartpointMode.CLOSE_TO_MAX;
  }
}

async function fitCurveTarget(
  target: FitCurveTarget,
  options: FitOptions,
): Promise<LifetimeRes> {
  const histogram = await getFluorescenceDecay({
    upload_id: options.uploadId,
    measurement_id: target.measurementId,
    bin_size_ms: options.bin,
    channel: target.channel,
    ...(target.level
      ? {
          start_photon_idx: target.level.start_index,
          end_photon_idx: target.level.end_index,
        }
      : {}),
  });
  if (!histogram.times?.length || !histogram.counts?.length) {
    throw new Error("No decay histogram data");
  }

  const request: LifetimeReq = {
    upload_id: options.uploadId,
    measurement_id: target.measurementId,
    channel: target.channel,
    use_irf: options.useIRF,
    times: histogram.times,
    counts: histogram.counts,
    num_exponentials: options.numExponents,
    tau_init: options.tauInit,
    tau_bounds: options.tauBounds,
    autostart: options.autostart,
    autoend: options.autoend,
    start: options.start,
    end: options.end,
    background: options.background,
    shift_init: options.shiftInit,
    shift_bounds: options.shiftBounds,
    fit_irf_fwhm: options.fitIrfFwhm,
    irf_fwhm_init: options.irfFwhmInit,
    irf_fwhm_bounds: options.irfFwhmBounds,
  };
  return getLifetimeData(request);
}

function getTargetLabel(target: FitCurveTarget): string {
  const levelLabel = target.levelIndex === undefined
    ? ""
    : `, level ${target.levelIndex + 1}`;
  return `${target.measurementId}, channel ${target.channel}${levelLabel}`;
}

export default function FittingDialog() {
  const [background, setBackground] = useState<boolean>(true);
  const [detectEndpoint, setDetectEndpoint] = useState<boolean>(true);
  const [startMode, setStartMode] = useState<string>("(Close to) max");
  const [useIRF, setUseIRF] = useState<boolean>(true);
  const [useSimulatedIRF, setUseSimulatedIRF] = useState<boolean>(false);
  const [fitFWHM, setFitFWHM] = useState<boolean>(false);
  const [scope, setScope] = useState<string>("Current");
  const [fitTarget, setFitTarget] = useState<FitTargetKind>("measurement");
  const [numExponents, setNumExponents] = useState<number>(1);

  // Multi-exponential lifetime initial guesses (defaults match Full-SMS desktop)
  const [tau1Init, setTau1Init] = useState<number>(5.0);
  const [tau2Init, setTau2Init] = useState<number>(1.0);
  const [tau3Init, setTau3Init] = useState<number>(0.1);

  const [boundsMin, setBoundsMin] = useState<number>(0.01);
  const [boundsMax, setBoundsMax] = useState<number>(100.0);
  const [fhwm, setFhwm] = useState<number>(0.1);
  const [fwhmBoundsMin, setFwhmBoundsMin] = useState<number>(0);
  const [fwhmBoundsMax, setFwhmBoundsMax] = useState<number>(2);
  const [shiftInit, setShiftInit] = useState<number>(0);
  const [shiftBoundsMin, setShiftBoundsMin] = useState<number>(-2000);
  const [shiftBoundsMax, setShiftBoundsMax] = useState<number>(2000);
  const [startChannel, setStartChannel] = useState<number>(0);
  const [endChannel, setEndChannel] = useState<number>(4096);
  const [backgroundValue, setBackgroundValue] = useState<number>(0);

  const {
    setFittingDialogOpen,
    setFitResult,
    setFitResultForTarget,
    selectedLevelIdx,
  } = useAnalysisTab();

  const {
    currentMeasurement,
    currentUpload,
    currentChannel,
    currentMappedIrf,
    currentWorkspaceId,
    cpaData,
    cpaResults,
    hdf5Metadata,
    isMultiChannel,
    selectedMeasurements,
    selectedChannels,
    bin,
  } = useHdf5Data();
  const { errorToast, successToast } = useToast();

  const recordHist = useHistoryRecorder(
    currentWorkspaceId,
    currentUpload,
    "lifetime",
  );

  const initialSettings = useRef({
    numExponents,
    tau1Init,
    tau2Init,
    tau3Init,
    boundsMin,
    boundsMax,
    background,
    detectEndpoint,
    useIRF,
    useSimulatedIRF,
    fitFWHM,
    fhwm,
    fwhmBoundsMin,
    fwhmBoundsMax,
  });

  const selectedLevel =
    selectedLevelIdx === null ? undefined : cpaData?.levels?.[selectedLevelIdx];
  const canFitSelectedLevel = selectedLevel !== undefined;
  const canFitAllLevels = Object.values(cpaResults).some(
    (result) => (result.levels?.length ?? 0) > 0,
  );
  const availableTargets: FitTargetKind[] = [
    "measurement",
    ...(canFitSelectedLevel ? ["selected-level" as const] : []),
    ...(canFitAllLevels ? ["all-levels" as const] : []),
  ];
  const activeFitTarget = availableTargets.includes(fitTarget)
    ? fitTarget
    : "measurement";

  const getScopedMeasurements = () => {
    const summaries = hdf5Metadata?.measurements_summary ?? [];
    if (scope === "Current") {
      return currentMeasurement && currentMeasurement !== "0"
        ? [{ measurementId: currentMeasurement, channel: currentChannel }]
        : [];
    }

    if (scope === "All") {
      return summaries.flatMap((measurement) =>
        (measurement.channels?.length
          ? measurement.channels.map((_, index) => index + 1)
          : [1]
        ).map((channel) => ({
          measurementId: String(measurement.id),
          channel,
        })),
      );
    }

    if (isMultiChannel) {
      return Array.from(selectedChannels).flatMap((key) => {
        const [measurementId, channelValue] = key.split(":");
        const channel = Number(channelValue);
        return measurementId && Number.isInteger(channel) && channel > 0
          ? [{ measurementId, channel }]
          : [];
      });
    }

    return Array.from(selectedMeasurements).map((measurementId) => ({
      measurementId,
      channel: 1,
    }));
  };

  const getFitTargets = (): FitCurveTarget[] => {
    if (activeFitTarget === "selected-level") {
      if (!selectedLevel || currentMeasurement === "0") return [];
      return [{
            measurementId: currentMeasurement,
            channel: currentChannel,
            level: selectedLevel,
            levelIndex: selectedLevelIdx ?? undefined,
          }];
    }

    const measurements = getScopedMeasurements();
    if (activeFitTarget !== "all-levels") return measurements;

    return measurements.flatMap(({ measurementId, channel }) => {
      const cpaKey = isMultiChannel
        ? `${measurementId}:${channel}`
        : measurementId;
      const levels = cpaResults[cpaKey]?.levels ?? [];
      return levels.flatMap((level, levelIndex) =>
        level.num_photons >= 100
          ? [{ measurementId, channel, level, levelIndex }]
          : [],
      );
    });
  };

  const fetchLifetimeFitting = async (targets: FitCurveTarget[]) => {
    const tauInit = [tau1Init, tau2Init, tau3Init].slice(0, numExponents);
    const fitOptions = createFitOptions({
      uploadId: currentUpload,
      bin,
      useIRF,
      useSimulatedIRF,
      fitFWHM,
      numExponents,
      tauInit,
      boundsMin,
      boundsMax,
      startMode,
      detectEndpoint,
      startChannel,
      endChannel,
      background,
      backgroundValue,
      shiftInit,
      shiftBoundsMin,
      shiftBoundsMax,
      fhwm,
      fwhmBoundsMin,
      fwhmBoundsMax,
    });
    const outcomes = await executeFitTargets(targets, fitOptions);
    const failures = storeFitOutcomes(outcomes, {
      uploadId: currentUpload,
      currentMeasurement,
      currentChannel,
      selectedLevelIdx,
      setFitResult,
      setFitResultForTarget,
    });
    const successCount = targets.length - failures.length;

    if (successCount > 0) {
      successToast(`Completed ${successCount} lifetime fit${successCount === 1 ? "" : "s"}`);
    }
    if (failures.length > 0) {
      errorToast(`Failed ${failures.length} lifetime fit${failures.length === 1 ? "" : "s"}: ${failures.slice(0, 3).join("; ")}`);
    }
  };

  const handleFit = () => {
    const targets = getFitTargets();
    if (targets.length === 0) {
      errorToast(
        activeFitTarget === "all-levels"
          ? "No resolved levels with at least 100 photons are available in this scope"
          : "No measurements or channels are selected for fitting",
      );
      return;
    }

    const newSettings = {
      numExponents,
      tau1Init,
      tau2Init,
      tau3Init,
      boundsMin,
      boundsMax,
      background,
      detectEndpoint,
      useIRF,
      useSimulatedIRF,
      fitFWHM,
      fhwm,
      fwhmBoundsMin,
      fwhmBoundsMax,
    };
    recordHist("fit_settings", initialSettings.current, newSettings);
    initialSettings.current = newSettings;
    setFittingDialogOpen(false);
    void fetchLifetimeFitting(targets);
  };

  return (
    <Card className="flex flex-col h-[80vh] w-full text-xs border-0 overflow-y-auto">
      <CardContent className="border-t font-semibold">Fit Target</CardContent>
      <div className="p-4 border-b">
        <select
          name="fit-target"
          className="border p-2 rounded-sm font-mono bg-card"
          value={activeFitTarget}
          onChange={(event) => setFitTarget(event.target.value as FitTargetKind)}
        >
          <option value="measurement">Measurement (full decay)</option>
          {canFitSelectedLevel && (
            <option value="selected-level">Selected Level</option>
          )}
          {canFitAllLevels && <option value="all-levels">All Levels</option>}
        </select>

        <div className="flex flex-row mt-2 items-center">
          <label htmlFor="Scope" className="mr-2">
            Scope:{" "}
          </label>
          <select
            name="Scope"
            id="Scope"
            className="border p-2 rounded-sm font-mono bg-card"
            value={activeFitTarget === "selected-level" ? "Current" : scope}
            disabled={activeFitTarget === "selected-level"}
            onChange={(e) => setScope(e.target.value)}
          >
            <option value="Current">Current</option>
            <option value="Selected">Selected</option>
            <option value="All">All</option>
          </select>
        </div>
      </div>

      <CardContent className="font-semibold">
        Number of Exponentials
      </CardContent>
      <div className="p-4 border-b">
        <select
          name="Number of exponentials"
          className="border p-2 rounded-sm w-48 font-mono bg-card"
          value={numExponents}
          onChange={(e) => setNumExponents(Number(e.target.value))}
        >
          <option className="font-mono" value={1}>
            1 (Single Exponential)
          </option>
          <option className="font-mono" value={2}>
            2 (Double Exponential)
          </option>
          <option className="font-mono" value={3}>
            3 (Triple Exponential)
          </option>
        </select>
      </div>

      <CardContent className="font-semibold">
        Lifetime Parameters (tau, ns)
      </CardContent>
      <div className="p-4 border-b flex flex-col gap-2">
        <div className="flex items-center">
          <label className="w-20" htmlFor="tau1 init">
            &tau;<sub>1</sub> init:{" "}
          </label>
          <input
            className="border rounded-sm p-1 bg-card"
            type="number"
            name="tau1 init"
            min={0.001}
            step={0.1}
            value={tau1Init}
            onChange={(e) => setTau1Init(Number(e.target.value))}
          />
        </div>

        {numExponents >= 2 && (
          <div className="flex items-center">
            <label className="w-20" htmlFor="tau2 init">
              &tau;<sub>2</sub> init:{" "}
            </label>
            <input
              className="border rounded-sm p-1 bg-card"
              type="number"
              name="tau2 init"
              min={0.001}
              step={0.1}
              value={tau2Init}
              onChange={(e) => setTau2Init(Number(e.target.value))}
            />
          </div>
        )}

        {numExponents >= 3 && (
          <div className="flex items-center">
            <label className="w-20" htmlFor="tau3 init">
              &tau;<sub>3</sub> init:{" "}
            </label>
            <input
              className="border rounded-sm p-1 bg-card"
              type="number"
              name="tau3 init"
              min={0.001}
              step={0.1}
              value={tau3Init}
              onChange={(e) => setTau3Init(Number(e.target.value))}
            />
          </div>
        )}

        <div className="mt-2">
          <p className="mb-2 font-bold">Bounds (ns): </p>
          <div className="flex items-center gap-4">
            <label htmlFor="min" className="mr-1">
              min:
            </label>
            <input
              className="border rounded-sm p-1 w-24 bg-card"
              type="number"
              name="min"
              min={0.001}
              step={0.01}
              value={boundsMin}
              onChange={(e) => setBoundsMin(Number(e.target.value))}
            />
            <label htmlFor="max" className="mr-1">
              max:
            </label>
            <input
              className="border rounded-sm p-1 w-24 bg-card"
              type="number"
              name="max"
              min={0.01}
              step={1}
              value={boundsMax}
              onChange={(e) => setBoundsMax(Number(e.target.value))}
            />
          </div>
        </div>
      </div>

      <CardContent className="font-semibold">IRF Settings</CardContent>
      <div className="p-4 border-b">
        {currentMappedIrf && (
          <p className="font-bold mb-2 text-primary">
            Active Mapped IRF: {currentMappedIrf.name}
          </p>
        )}
        <Toggle label="Use IRF" checked={useIRF} onCheckedChange={setUseIRF} />
        {useIRF && (
          <div className="mt-2 pl-4 border-l-2 border-border">
            <Toggle
              label="Use Simulated IRF"
              checked={useSimulatedIRF}
              onCheckedChange={setUseSimulatedIRF}
            />

            {useSimulatedIRF && (
              <div className="mt-2">
                <div className="flex items-center mb-2">
                  <label htmlFor="FWHM (ns)" className="mr-2">
                    FWHM (ns):
                  </label>
                  <input
                    className="border rounded-sm p-1 bg-card w-24"
                    type="number"
                    name="FWHM (ns)"
                    min={0.001}
                    step={0.05}
                    value={fhwm}
                    onChange={(e) => setFhwm(Number(e.target.value))}
                  />
                </div>
                <Toggle
                  label="Fit FWHM"
                  checked={fitFWHM}
                  onCheckedChange={setFitFWHM}
                />
                {fitFWHM && (
                  <div className="mt-2 pl-4">
                    <p className="font-medium">FWHM bounds:</p>
                    <div className="flex items-center gap-4 mt-1">
                      <label htmlFor="fwhm-min">min:</label>
                      <input
                        className="border rounded-sm p-1 w-20 bg-card"
                        type="number"
                        name="fwhm-min"
                        min={0}
                        step={0.05}
                        value={fwhmBoundsMin}
                        onChange={(e) =>
                          setFwhmBoundsMin(Number(e.target.value))
                        }
                      />
                      <label htmlFor="fwhm-max">max:</label>
                      <input
                        className="border rounded-sm p-1 w-20 bg-card"
                        type="number"
                        name="fwhm-max"
                        min={0.01}
                        step={0.1}
                        value={fwhmBoundsMax}
                        onChange={(e) =>
                          setFwhmBoundsMax(Number(e.target.value))
                        }
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="mt-4">
              <p className="font-medium">Shift (channels):</p>
              <div className="flex items-center gap-2 mt-1">
                <label htmlFor="init-shift">init:</label>
                <input
                  className="border rounded-sm p-1 w-24 bg-card"
                  type="number"
                  name="shift-init"
                  step={1}
                  value={shiftInit}
                  onChange={(e) => setShiftInit(Number(e.target.value))}
                />
              </div>

              <div className="flex items-center gap-4 mt-2">
                <label htmlFor="shift-min">min:</label>
                <input
                  className="border rounded-sm p-1 w-24 bg-card"
                  type="number"
                  name="shift-min"
                  step={10}
                  value={shiftBoundsMin}
                  onChange={(e) => setShiftBoundsMin(Number(e.target.value))}
                />
                <label htmlFor="shift-max">max:</label>
                <input
                  className="border rounded-sm p-1 w-24 bg-card"
                  type="number"
                  name="shift-max"
                  step={10}
                  value={shiftBoundsMax}
                  onChange={(e) => setShiftBoundsMax(Number(e.target.value))}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      <CardContent className="font-semibold">Fit Range</CardContent>
      <div className="p-4 border-b">
        <div className="flex items-center gap-2 mb-2">
          <label htmlFor="Start Mode">Start Mode: </label>
          <select
            name="Start Mode"
            id="Start Mode"
            className="border p-2 rounded-sm font-mono bg-card"
            value={startMode}
            onChange={(e) => setStartMode(e.target.value)}
          >
            <option className="font-mono" value="Manual">
              Manual
            </option>
            <option className="font-mono" value="(Close to) max">
              (Close to) max
            </option>
            <option className="font-mono" value="Rise middle">
              Rise middle
            </option>
            <option className="font-mono" value="Rise start">
              Rise start
            </option>
            <option className="font-mono" value="Safe rise start">
              Safe rise start
            </option>
          </select>
        </div>

        {startMode === "Manual" && (
          <div className="mt-2 mb-2 flex items-center">
            <label htmlFor="Start Channel" className="mr-2">
              Start channel:{" "}
            </label>
            <input
              className="border rounded-sm p-1 w-24 bg-card"
              type="number"
              name="Start Channel"
              min={0}
              step={1}
              value={startChannel}
              onChange={(e) => setStartChannel(Number(e.target.value))}
            />
          </div>
        )}

        <Toggle
          label="Auto-detect Endpoint"
          checked={detectEndpoint}
          onCheckedChange={setDetectEndpoint}
        />

        {!detectEndpoint && (
          <div className="mt-2 flex items-center">
            <label htmlFor="End Channel" className="mr-2">
              End channel:{" "}
            </label>
            <input
              className="border rounded-sm p-1 w-24 bg-card"
              type="number"
              name="End Channel"
              min={0}
              step={1}
              value={endChannel}
              onChange={(e) => setEndChannel(Number(e.target.value))}
            />
          </div>
        )}
      </div>

      <CardContent className="font-semibold">Background</CardContent>
      <div className="p-4 border-b">
        <Toggle
          label="Auto-estimate background"
          checked={background}
          onCheckedChange={setBackground}
        />
        {!background && (
          <div className="mt-2 flex items-center">
            <label htmlFor="Background value" className="mr-2">
              Background value:{" "}
            </label>
            <input
              className="border rounded-sm p-1 w-24 bg-card"
              type="number"
              name="Background value"
              min={0}
              step={0.1}
              value={backgroundValue}
              onChange={(e) => setBackgroundValue(Number(e.target.value))}
            />
          </div>
        )}
      </div>

      <CardFooter className="flex flex-row mt-4 pt-2">
        <Button variant="primary" className="mr-2 px-10" onClick={handleFit}>
          Fit
        </Button>
        <Button variant="outline" onClick={() => setFittingDialogOpen(false)}>
          Cancel
        </Button>
      </CardFooter>
    </Card>
  );
}
