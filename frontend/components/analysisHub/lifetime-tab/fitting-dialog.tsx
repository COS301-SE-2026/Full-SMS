"use client";

import { Button, Card, CardContent, CardFooter, Toggle } from "@/components/ui";
import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useHdf5Data } from "@/contexts/hdf5Context/Hdf5DataContext";
import { LifetimeFitDialogSettings, useAnalysisTab } from "@/contexts/analysisTabsContext/AnalysisTabsContext";
import { LifetimeReq, LifetimeRes, LevelData, StartpointMode } from "@/types/analysis";
import { getFluorescenceDecay, getLifetimeData } from "@/services/analysisServices";
import { useHistoryRecorder } from "@/hooks/useHistoryRecorder";
import { useToast } from "@/contexts/toastContext/ToastContext";
import {
  fitTargetKey,
  groupFitKeyPart,
  groupLevels,
  groupPhotonCount,
  levelFitKeyPart,
  photonRanges,
  selectedGroups,
} from "@/lib/lifetimeTargets";

type FitTargetKind = LifetimeFitDialogSettings["fitTarget"];
type FitCurveTarget = {
  measurementId: string;
  channel: number;
  level?: LevelData;
  levelIndex?: number;
  // A group's decay pools the photons of all its levels
  group?: { id: number; levels: LevelData[] };
};

// Levels and groups with fewer photons than this are skipped by "All Levels"/"All Groups"
const MIN_TARGET_PHOTONS = 100;
type FitOptions = {
  uploadId: string;
  workspaceId: string | null;
  bin: number;
  useIRF: boolean;
  numExponents: number;
  tauInit: number[];
  tauBoundsPerComponent: [number, number][];
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
  simulatedIrfFwhm: number | null;
};
type FitOutcome = { target: FitCurveTarget; result: LifetimeRes | null; error?: string };

function describeFitError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const detail = error.response?.data?.detail;
    if (typeof detail === "string" && detail) return detail;
  }
  return error instanceof Error ? error.message : String(error);
}
const TAU_COMPONENTS = [
  { key: "tau1", index: 0 },
  { key: "tau2", index: 1 },
  { key: "tau3", index: 2 },
] as const;

function createFitOptions(values: {
  uploadId: string;
  workspaceId: string | null;
  bin: number;
  useIRF: boolean;
  useSimulatedIRF: boolean;
  fitFWHM: boolean;
  numExponents: number;
  tauInit: number[];
  tauBoundsPerComponent: [number, number][];
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
  const useSimulatedIrf = values.useIRF && values.useSimulatedIRF;
  const fitIrfFwhm = useSimulatedIrf && values.fitFWHM;
  return {
    uploadId: values.uploadId,
    workspaceId: values.workspaceId,
    bin: values.bin,
    useIRF: values.useIRF,
    numExponents: values.numExponents,
    tauInit: values.tauInit,
    tauBoundsPerComponent: values.tauBoundsPerComponent,
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
    simulatedIrfFwhm: useSimulatedIrf ? values.fhwm : null,
  };
}

function TauParameterRow({
  index,
  initial,
  bounds,
  onInitialChange,
  onBoundsChange,
}: Readonly<{
  index: number;
  initial: number;
  bounds: [number, number];
  onInitialChange: (value: number) => void;
  onBoundsChange: (boundIndex: 0 | 1, value: number) => void;
}>) {
  return (
    <div className="grid grid-cols-[3rem_repeat(3,minmax(0,1fr))] items-center gap-2">
      <span>&tau;<sub>{index + 1}</sub></span>
      <input
        aria-label={`tau${index + 1} initial (ns)`}
        className="min-w-0 border rounded-sm p-1 bg-card"
        type="number"
        step={0.1}
        value={initial}
        onChange={(event) => onInitialChange(Number(event.target.value))}
      />
      <input
        aria-label={`tau${index + 1} minimum (ns)`}
        className="min-w-0 border rounded-sm p-1 bg-card"
        type="number"
        step={0.01}
        value={bounds[0]}
        onChange={(event) => onBoundsChange(0, Number(event.target.value))}
      />
      <input
        aria-label={`tau${index + 1} maximum (ns)`}
        className="min-w-0 border rounded-sm p-1 bg-card"
        type="number"
        step={1}
        value={bounds[1]}
        onChange={(event) => onBoundsChange(1, Number(event.target.value))}
      />
    </div>
  );
}

function validateLifetimeParameters(
  numExponents: number,
  tauInit: number[],
  tauBounds: [number, number][],
): string | null {
  for (let index = 0; index < numExponents; index += 1) {
    const initial = tauInit[index];
    const [minimum, maximum] = tauBounds[index] ?? [];
    if (!Number.isFinite(minimum) || !Number.isFinite(maximum) || minimum >= maximum) {
      return `tau${index + 1} minimum must be less than its maximum`;
    }
    if (!Number.isFinite(initial) || initial < minimum || initial > maximum) {
      return `tau${index + 1} initial value must be within its bounds`;
    }
  }
  return null;
}

function validateFwhmParameters(
  initial: number,
  bounds: [number, number],
): string | null {
  const [minimum, maximum] = bounds;
  if (!Number.isFinite(minimum) || !Number.isFinite(maximum) || minimum >= maximum) {
    return "FWHM minimum must be less than its maximum";
  }
  if (!Number.isFinite(initial) || initial < minimum || initial > maximum) {
    return "FWHM initial value must be within its bounds";
  }
  return null;
}

function executeFitWorker(
  targets: FitCurveTarget[],
  options: FitOptions,
  index: number,
  stride: number,
): Promise<FitOutcome[]> {
  const outcomes: FitOutcome[] = [];
  const runNext = (targetIndex: number): Promise<void> => {
    const target = targets[targetIndex];
    if (!target) return Promise.resolve();

    return fitCurveTarget(target, options)
      .then((result) => outcomes.push({ target, result }))
      .catch((error: unknown) => {
        console.error(`Lifetime fit failed for ${getTargetLabel(target)}`, error);
        outcomes.push({ target, result: null, error: describeFitError(error) });
      })
      .then(() => runNext(targetIndex + stride));
  };
  return runNext(index).then(() => outcomes);
}

async function executeFitTargets(
  targets: FitCurveTarget[],
  options: FitOptions,
): Promise<FitOutcome[]> {
  const workerCount = Math.min(4, targets.length);
  const workers = Array.from({ length: workerCount }, (_, index) =>
    executeFitWorker(targets, options, index, workerCount),
  );
  return (await Promise.all(workers)).flat();
}

function storeFitOutcomes(
  outcomes: FitOutcome[],
  values: {
    uploadId: string;
    setFitResultForTarget: (key: string, result: LifetimeRes) => void;
  },
): string[] {
  const failures: string[] = [];
  for (const { target, result, error } of outcomes) {
    if (!result) {
      failures.push(`${getTargetLabel(target)} (${error ?? "unknown error"})`);
      continue;
    }
    let keyPart = "full";
    if (target.group) keyPart = groupFitKeyPart(target.group.levels);
    else if (target.level) keyPart = levelFitKeyPart(target.level);
    values.setFitResultForTarget(
      fitTargetKey(values.uploadId, target.measurementId, target.channel, keyPart),
      result,
    );
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
    ...(target.group ? { photon_ranges: photonRanges(target.group.levels) } : {}),
  });
  if (!histogram.times?.length || !histogram.counts?.length) {
    throw new Error("No decay histogram data");
  }

  const request: LifetimeReq = {
    upload_id: options.uploadId,
    workspace_id: options.workspaceId,
    measurement_id: target.measurementId,
    channel: target.channel,
    use_irf: options.useIRF,
    times: histogram.times,
    counts: histogram.counts,
    num_exponentials: options.numExponents,
    tau_init: options.tauInit,
    tau_bounds: options.tauBoundsPerComponent[0],
    tau_bounds_per_component: options.tauBoundsPerComponent,
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
    simulated_irf_fwhm: options.simulatedIrfFwhm,
  };
  return getLifetimeData(request);
}

function activeFitTargetOf(
  availableTargets: FitTargetKind[],
  fitTarget: FitTargetKind,
): FitTargetKind {
  return availableTargets.includes(fitTarget) ? fitTarget : "measurement";
}

function getTargetLabel(target: FitCurveTarget): string {
  let partLabel = "";
  if (target.group) partLabel = `, group ${target.group.id + 1}`;
  else if (target.levelIndex !== undefined) partLabel = `, level ${target.levelIndex + 1}`;
  return `${target.measurementId}, channel ${target.channel}${partLabel}`;
}

export default function FittingDialog() {
  const {
    setFittingDialogOpen,
    setFitResultForTarget,
    selectedLevelIdx,
    selectedGroupIdx,
    fitDialogSettings,
    setFitDialogSettings,
  } = useAnalysisTab();

  const [background, setBackground] = useState(fitDialogSettings.background);
  const [detectEndpoint, setDetectEndpoint] = useState(fitDialogSettings.detectEndpoint);
  const [startMode, setStartMode] = useState(fitDialogSettings.startMode);
  const [useIRF, setUseIRF] = useState(fitDialogSettings.useIRF);
  const [useSimulatedIRF, setUseSimulatedIRF] = useState(fitDialogSettings.useSimulatedIRF);
  const [fitFWHM, setFitFWHM] = useState(fitDialogSettings.fitFWHM);
  const [scope, setScope] = useState(fitDialogSettings.scope);
  const [fitTarget, setFitTarget] = useState<FitTargetKind>(fitDialogSettings.fitTarget);
  const [numExponents, setNumExponents] = useState(fitDialogSettings.numExponents);
  const [tauInit, setTauInit] = useState<[number, number, number]>(fitDialogSettings.tauInit);
  const [tauBounds, setTauBounds] = useState<[[number, number], [number, number], [number, number]]>(fitDialogSettings.tauBounds);
  const [fhwm, setFhwm] = useState(fitDialogSettings.fhwm);
  const [fwhmBoundsMin, setFwhmBoundsMin] = useState(fitDialogSettings.fwhmBoundsMin);
  const [fwhmBoundsMax, setFwhmBoundsMax] = useState(fitDialogSettings.fwhmBoundsMax);
  const [shiftInit, setShiftInit] = useState(fitDialogSettings.shiftInit);
  const [shiftBoundsMin, setShiftBoundsMin] = useState(fitDialogSettings.shiftBoundsMin);
  const [shiftBoundsMax, setShiftBoundsMax] = useState(fitDialogSettings.shiftBoundsMax);
  const [startChannel, setStartChannel] = useState(fitDialogSettings.startChannel);
  const [endChannel, setEndChannel] = useState(fitDialogSettings.endChannel);
  const [backgroundValue, setBackgroundValue] = useState(fitDialogSettings.backgroundValue);

  const updateTauInitial = (index: number, value: number) => {
    setTauInit((previous) => {
      const updated = [...previous] as [number, number, number];
      updated[index] = value;
      return updated;
    });
  };
  const updateTauBound = (index: number, boundIndex: 0 | 1, value: number) => {
    setTauBounds((previous) => {
      const updated = previous.map((bounds, componentIndex) => {
        if (componentIndex !== index) return bounds;
        return boundIndex === 0
          ? [value, bounds[1]] as [number, number]
          : [bounds[0], value] as [number, number];
      }) as [[number, number], [number, number], [number, number]];
      return updated;
    });
  };

  const {
    currentMeasurement,
    currentUpload,
    currentChannel,
    currentMappedIrf,
    currentWorkspaceId,
    cpaData,
    cpaResults,
    groupingData,
    groupingResults,
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
    tauInit,
    tauBounds,
    background,
    detectEndpoint,
    useIRF,
    useSimulatedIRF,
    fitFWHM,
    fhwm,
    fwhmBoundsMin,
    fwhmBoundsMax,
  });

  useEffect(() => {
    setFitDialogSettings({
      background,
      detectEndpoint,
      startMode,
      useIRF,
      useSimulatedIRF,
      fitFWHM,
      scope,
      fitTarget,
      numExponents,
      tauInit,
      tauBounds,
      shiftInit,
      shiftBoundsMin,
      shiftBoundsMax,
      startChannel,
      endChannel,
      backgroundValue,
      fhwm,
      fwhmBoundsMin,
      fwhmBoundsMax,
    });
  }, [background, detectEndpoint, startMode, useIRF, useSimulatedIRF, fitFWHM, scope, fitTarget, numExponents, tauInit, tauBounds, shiftInit, shiftBoundsMin, shiftBoundsMax, startChannel, endChannel, backgroundValue, fhwm, fwhmBoundsMin, fwhmBoundsMax, setFitDialogSettings]);

  const selectedLevel =
    selectedLevelIdx === null ? undefined : cpaData?.levels?.[selectedLevelIdx];
  const canFitSelectedLevel = selectedLevel !== undefined;
  const canFitAllLevels = Object.values(cpaResults).some(
    (result) => (result.levels?.length ?? 0) > 0,
  );
  const selectedGroup =
    selectedGroupIdx === null ? undefined : selectedGroups(groupingData)[selectedGroupIdx];
  const selectedGroupMembers = selectedGroup
    ? groupLevels(selectedGroup, cpaData?.levels ?? [])
    : null;
  const canFitSelectedGroup = selectedGroup !== undefined && selectedGroupMembers !== null;
  const canFitAllGroups = Object.values(groupingResults).some(
    (result) => selectedGroups(result).length > 0,
  );
  const availableTargets: FitTargetKind[] = [
    "measurement",
    ...(canFitSelectedLevel ? ["selected-level" as const] : []),
    ...(canFitAllLevels ? ["all-levels" as const] : []),
    ...(canFitSelectedGroup ? ["selected-group" as const] : []),
    ...(canFitAllGroups ? ["all-groups" as const] : []),
  ];
  const activeFitTarget = activeFitTargetOf(availableTargets, fitTarget);
  // Selected level/group targets only exist for the current measurement
  const isSingleTarget =
    activeFitTarget === "selected-level" || activeFitTarget === "selected-group";

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

    if (activeFitTarget === "selected-group") {
      if (!selectedGroup || !selectedGroupMembers || currentMeasurement === "0") return [];
      return [{
        measurementId: currentMeasurement,
        channel: currentChannel,
        group: { id: selectedGroup.group_id, levels: selectedGroupMembers },
      }];
    }

    const measurements = getScopedMeasurements();
    if (activeFitTarget === "measurement") return measurements;

    return measurements.flatMap(({ measurementId, channel }): FitCurveTarget[] => {
      // cpaResults and groupingResults share keys
      const resultKey = isMultiChannel
        ? `${measurementId}:${channel}`
        : measurementId;
      const levels = cpaResults[resultKey]?.levels ?? [];

      if (activeFitTarget === "all-groups") {
        return selectedGroups(groupingResults[resultKey]).flatMap((group) => {
          const members = groupLevels(group, levels);
          return members && groupPhotonCount(members) >= MIN_TARGET_PHOTONS
            ? [{ measurementId, channel, group: { id: group.group_id, levels: members } }]
            : [];
        });
      }

      return levels.flatMap((level, levelIndex) =>
        level.num_photons >= MIN_TARGET_PHOTONS
          ? [{ measurementId, channel, level, levelIndex }]
          : [],
      );
    });
  };

  const fetchLifetimeFitting = async (targets: FitCurveTarget[]) => {
    const activeTauInit = tauInit.slice(0, numExponents);
    const activeTauBounds = tauBounds.slice(0, numExponents);
    const fitOptions = createFitOptions({
      uploadId: currentUpload,
      workspaceId: currentWorkspaceId,
      bin,
      useIRF,
      useSimulatedIRF,
      fitFWHM,
      numExponents,
      tauInit: activeTauInit,
      tauBoundsPerComponent: activeTauBounds,
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
    const activeTauInit = tauInit.slice(0, numExponents);
    const activeTauBounds = tauBounds.slice(0, numExponents);
    const tauValidationError = validateLifetimeParameters(
      numExponents,
      activeTauInit,
      activeTauBounds,
    );
    if (tauValidationError) {
      errorToast(tauValidationError);
      return;
    }
    if (useIRF && useSimulatedIRF && !fitFWHM && !(Number.isFinite(fhwm) && fhwm > 0)) {
      errorToast("FWHM must be greater than 0");
      return;
    }
    if (useIRF && useSimulatedIRF && fitFWHM) {
      const fwhmValidationError = validateFwhmParameters(fhwm, [
        fwhmBoundsMin,
        fwhmBoundsMax,
      ]);
      if (fwhmValidationError) {
        errorToast(fwhmValidationError);
        return;
      }
    }

    const targets = getFitTargets();
    if (targets.length === 0) {
      const emptyMessages: Partial<Record<FitTargetKind, string>> = {
        "all-levels": `No resolved levels with at least ${MIN_TARGET_PHOTONS} photons are available in this scope`,
        "all-groups": `No groups with at least ${MIN_TARGET_PHOTONS} photons are available in this scope`,
      };
      errorToast(
        emptyMessages[activeFitTarget] ?? "No measurements or channels are selected for fitting",
      );
      return;
    }

    const newSettings = {
      numExponents,
      tauInit,
      tauBounds,
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
          onChange={(event) => {
            const target = event.target.value as FitTargetKind;
            setFitTarget(target);
            if (target === "selected-level" || target === "selected-group") setScope("Current");
          }}
        >
          <option value="measurement">Measurement (full decay)</option>
          {canFitSelectedLevel && (
            <option value="selected-level">Selected Level</option>
          )}
          {canFitAllLevels && <option value="all-levels">All Levels</option>}
          {canFitSelectedGroup && (
            <option value="selected-group">
              Selected Group (group {selectedGroup.group_id + 1})
            </option>
          )}
          {canFitAllGroups && <option value="all-groups">All Groups</option>}
        </select>

        <div className="flex flex-row mt-2 items-center">
          <label htmlFor="Scope" className="mr-2">
            Scope:{" "}
          </label>
          <select
            name="Scope"
            id="Scope"
            className="border p-2 rounded-sm font-mono bg-card"
            value={isSingleTarget ? "Current" : scope}
            disabled={isSingleTarget}
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
        <div className="grid grid-cols-[3rem_repeat(3,minmax(0,1fr))] gap-2 text-muted-foreground">
          <span />
          <span>Init (ns)</span>
          <span>Min (ns)</span>
          <span>Max (ns)</span>
        </div>
        {TAU_COMPONENTS.slice(0, numExponents).map(({ key, index }) => (
          <TauParameterRow
            key={key}
            index={index}
            initial={tauInit[index]}
            bounds={tauBounds[index]}
            onInitialChange={(value) => updateTauInitial(index, value)}
            onBoundsChange={(boundIndex, value) =>
              updateTauBound(index, boundIndex, value)
            }
          />
        ))}
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
                        min={0.01}
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
