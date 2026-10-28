import { useCallback } from "react";
import { useAnalysisTab } from "@/contexts/analysisTabsContext/AnalysisTabsContext";
import { useHdf5Data } from "@/contexts/hdf5Context/Hdf5DataContext";
import { getFluorescenceDecay } from "@/services/analysisServices";

// Selects a CPA level (or the full trace when idx is null) and loads its decay histogram.
export function useLifetimeLevelSelection() {
  const { setSelectedLevelIdx, setFitResult, setDecayTimes, setDecayCounts, setDecayLoading } = useAnalysisTab();
  const { currentUpload, currentMeasurement, currentChannel, cpaData, bin } = useHdf5Data();

  return useCallback(
    async (idx: number | null) => {
      setSelectedLevelIdx(idx);
      setFitResult(null);

      const payload: any = {
        upload_id: currentUpload,
        measurement_id: currentMeasurement,
        bin_size_ms: bin,
        channel: currentChannel,
      };

      const level = idx === null ? undefined : cpaData?.levels?.[idx];
      if (level) {
        payload.start_photon_idx = level.start_index;
        payload.end_photon_idx = level.end_index;
      }

      setDecayLoading(true);
      try {
        const response = await getFluorescenceDecay(payload);
        setDecayTimes(response.times);
        setDecayCounts(response.counts);
      } catch (err) {
        console.error("Failed to load level decay:", err);
      } finally {
        setDecayLoading(false);
      }
    },
    [currentUpload, currentMeasurement, currentChannel, cpaData, bin, setSelectedLevelIdx, setFitResult, setDecayTimes, setDecayCounts, setDecayLoading],
  );
}
