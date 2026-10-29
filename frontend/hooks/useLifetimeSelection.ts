import { useCallback } from "react";
import { useAnalysisTab } from "@/contexts/analysisTabsContext/AnalysisTabsContext";
import { useHdf5Data } from "@/contexts/hdf5Context/Hdf5DataContext";
import { getFluorescenceDecay } from "@/services/analysisServices";
import { groupLevels, photonRanges, selectedGroups } from "@/lib/lifetimeTargets";

// Selects what the Lifetime tab shows and loads its decay histogram:
// a CPA level, a group (the pooled photons of all its levels), or the full trace.
export function useLifetimeSelection() {
  const {
    setSelectedLevelIdx,
    setSelectedGroupIdx,
    setFitResult,
    setDecayTimes,
    setDecayCounts,
    setDecayLoading,
  } = useAnalysisTab();
  const { currentUpload, currentMeasurement, currentChannel, cpaData, groupingData, bin } = useHdf5Data();

  const loadDecay = useCallback(
    async (ranges: [number, number][] | null) => {
      setFitResult(null);
      const payload: Record<string, unknown> = {
        upload_id: currentUpload,
        measurement_id: currentMeasurement,
        bin_size_ms: bin,
        channel: currentChannel,
      };
      if (ranges) payload.photon_ranges = ranges;

      setDecayLoading(true);
      try {
        const response = await getFluorescenceDecay(payload);
        setDecayTimes(response.times);
        setDecayCounts(response.counts);
      } catch (err) {
        console.error("Failed to load decay:", err);
      } finally {
        setDecayLoading(false);
      }
    },
    [currentUpload, currentMeasurement, currentChannel, bin, setFitResult, setDecayTimes, setDecayCounts, setDecayLoading],
  );

  // idx null shows the full trace
  const selectLevel = useCallback(
    async (idx: number | null) => {
      const level = idx === null ? undefined : cpaData?.levels?.[idx];
      setSelectedGroupIdx(null);
      setSelectedLevelIdx(level ? idx : null);
      await loadDecay(level ? [[level.start_index, level.end_index]] : null);
    },
    [cpaData, loadDecay, setSelectedLevelIdx, setSelectedGroupIdx],
  );

  const selectGroup = useCallback(
    async (idx: number) => {
      const group = selectedGroups(groupingData)[idx];
      const members = group ? groupLevels(group, cpaData?.levels ?? []) : null;
      if (!members) return;
      setSelectedLevelIdx(null);
      setSelectedGroupIdx(idx);
      await loadDecay(photonRanges(members));
    },
    [cpaData, groupingData, loadDecay, setSelectedLevelIdx, setSelectedGroupIdx],
  );

  return { selectLevel, selectGroup };
}
