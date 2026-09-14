"use client";

import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useMemo,
  useEffect,
  useCallback,
} from "react";
import { UploadMetadata } from "@/types/hdf5";
import {
  ChangePointResult,
  ClusteringRes,
  CorrelationRes,
  LevelData,
} from "@/types/analysis";

type Hdf5Response = {
  time_bins: number[];
  counts: number[];
  intensity_cps: number[];
};

type Confidence = 69 | 90 | 95 | 99;

export interface CachedPluginResult {
  status: "success" | "error";
  results?: Record<string, unknown>;
  error?: string;
  executionTimeMs?: number;
  executedAt: string;
  parameters?: Record<string, unknown>;
}

interface Hdf5DataContextType {
  //initial intensity response
  hdf5Data: Hdf5Response | undefined;
  setHdf5Data: (data: Hdf5Response) => void;

  //for client side upload progress updates
  isParsing: boolean;
  setIsParsing: (is_parsing: boolean) => void;

  //currently loaded upload in analysis hub
  currentUpload: string;
  setCurrentUpload: (upload_id: string) => void;

  //currently selected measuremnt
  currentMeasurement: string;
  setCurrentMeasurement: (measurement_id: string) => void;

  //upload metadata
  setHdf5Metadata: (metadata: UploadMetadata) => void;
  hdf5Metadata: UploadMetadata | undefined;

  bin: number;
  setBin: (bin: number) => void;

  confidence: Confidence;
  setConfidence: (conf: Confidence) => void;

  //single change point analysis result (derived from cpaResults for currentMeasurement)
  cpaData: ChangePointResult | undefined;
  setCpaData: (data: ChangePointResult) => void;

  //collection of all CPA results for current upload
  cpaResults: Record<string, ChangePointResult>;
  setCpaResults: React.Dispatch<
    React.SetStateAction<Record<string, ChangePointResult>>
  >;
  setCpaResultForMeasurement: (
    measurementId: string,
    result: ChangePointResult,
  ) => void;
  clearCpaResults: () => void;

  //measurement IDs actively resolving (for sidebar spinners)
  cpaProcessingIds: Set<string>;
  setCpaProcessingIds: React.Dispatch<React.SetStateAction<Set<string>>>;

  //aggregate all levels across all resolved measurements for grouping
  getAllResolvedLevels: () => LevelData[];

  setCurrentWorkspaceId: (id: string) => void;
  currentWorkspaceId: string | null;

  //single grouping analysis result
  groupingData: ClusteringRes | undefined;
  setGroupingData: (data: ClusteringRes) => void;

  //upload filename
  currentUploadName: string;
  setCurrentUploadName: (name: string) => void;

  heatMapColor: string;
  setHeatMapColor: (colour: string) => void;

  //selected measurements(checkbox selection)
  selectedMeasurements: Set<string>;
  toggleSelectedmeasurement: (measurement_id: string) => void;
  selectAllmeasurements: (total: number) => void;
  clearSelectedMeasurements: () => void;

  spectraHeatMapColor: string;
  setSpectraHeatMapColor: (colour: string) => void;

  getPluginResult: (
    pluginId: string,
    workspaceId: string,
    measurementId: string,
  ) => CachedPluginResult | null;
  setPluginResult: (
    pluginId: string,
    workspaceId: string,
    measurementId: string,
    result: CachedPluginResult,
  ) => void;
  clearPluginResults: () => void;

  //single correlation analysis result
  correlationData: CorrelationRes | undefined;
  setCorrelationData: (data: CorrelationRes) => void;
}



const Hdf5DataContext = createContext<Hdf5DataContextType | undefined>(
  undefined,
);

export function Hdf5DataProvider({
  children,
}: {
  readonly children: ReactNode;
}) {
  const [hdf5Data, setHdf5Data] = useState<Hdf5Response>({
    time_bins: [],
    counts: [],
    intensity_cps: [],
  });
  
  // --- Multi-measurement CPA state ---
  const [cpaResults, setCpaResults] = useState<Record<string, ChangePointResult>>({});
  const [cpaProcessingIds, setCpaProcessingIds] = useState<Set<string>>(new Set());

  const [hdf5Metadata, setHdf5Metadata] = useState<UploadMetadata | undefined>();
  const [isParsing, setIsParsing] = useState<boolean>(true);
  
  const [currentUpload, setCurrentUpload] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("currentUpload") || "";
    }
    return "";
  });

  const [currentMeasurement, setCurrentMeasurement] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("currentMeasurement") || "0";
    }
    return "0";
  });

  const [bin, setBin] = useState<number>(10);
  const [confidence, setConfidence] = useState<Confidence>(90);
  const [groupingData, setGroupingData] = useState<ClusteringRes>();
  const [currentUploadName, setCurrentUploadName] = useState<string>("");
  const [heatMapColor, setHeatMapColor] = useState<string>("");
  const [spectraHeatMapColor, setSpectraHeatMapColor] = useState<string>("");
  const [currentWorkspaceId, setCurrentWorkspaceId] = useState<string | null>(
    () => {
      if (typeof window !== "undefined")
        return localStorage.getItem("currentWorkspaceId") || null;
      return null;
    },
  );

  const [correlationData, setCorrelationData] = useState<CorrelationRes>();
  const [selectedMeasurements, setSelectedMeasurements] = useState<Set<string>>(new Set());
  const [pluginResultsCache, setPluginResultsCache] = useState<Record<string, CachedPluginResult>>({});

  // Reset CPA results if user switches to a different upload
  useEffect(() => {
    setCpaResults({});
    setCpaProcessingIds(new Set());
  }, [currentUpload]);

  // Derived: cpaData is always the result for currentMeasurement (backward-compatible)
  const cpaData = useMemo(() => {
    return cpaResults[currentMeasurement] || undefined;
  }, [cpaResults, currentMeasurement]);

  // Backward-compatible setter for cpaData (updates cpaResults for the measurement)
  const setCpaData = useCallback((data: ChangePointResult | undefined) => {
    if (!data) return;
    const targetId = data.measurement_id || currentMeasurement;
    setCpaResults((prev) => ({
      ...prev,
      [targetId]: data,
    }));
  }, [currentMeasurement]);

  // Helper to commit a single measurement result from batch processing
  const setCpaResultForMeasurement = useCallback(
    (measurementId: string, result: ChangePointResult) => {
      setCpaResults((prev) => ({
        ...prev,
        [measurementId]: result,
      }));
    },
    [],
  );

  const clearCpaResults = useCallback(() => {
    setCpaResults({});
  }, []);

  // Aggregates all levels across all resolved measurements (for Grouping / Export)
  const getAllResolvedLevels = useCallback((): LevelData[] => {
    const allLevels: LevelData[] = [];
    for (const result of Object.values(cpaResults)) {
      if (result?.levels) {
        allLevels.push(...result.levels);
      }
    }
    return allLevels;
  }, [cpaResults]);

  const getPluginResult = useCallback(
    (
      pluginId: string,
      workspaceId: string,
      measurementId: string,
    ): CachedPluginResult | null => {
      const key = `${pluginId}-${workspaceId}-${measurementId}`;
      return pluginResultsCache[key] || null;
    },
    [pluginResultsCache],
  );

  const setPluginResult = useCallback(
    (
      pluginId: string,
      workspaceId: string,
      measurementId: string,
      result: CachedPluginResult,
    ) => {
      const key = `${pluginId}-${workspaceId}-${measurementId}`;
      setPluginResultsCache((prev) => ({
        ...prev,
        [key]: result,
      }));
    },
    [],
  );

  const clearPluginResults = useCallback(() => {
    setPluginResultsCache({});
  }, []);

  function toggleSelectedmeasurement(measurement_id: string) {
    setSelectedMeasurements((previous) => {
      const next = new Set(previous);
      if (next.has(measurement_id)) {
        next.delete(measurement_id);
      } else {
        next.add(measurement_id);
      }
      return next;
    });
  }

  function selectAllmeasurements(total: number) {
    const all = new Set<string>();
    for (let i = 1; i <= total; i++) {
      all.add(i.toString());
    }
    setSelectedMeasurements(all);
  }

  function clearSelectedMeasurements() {
    setSelectedMeasurements(new Set());
  }

  useEffect(() => {
    if (currentWorkspaceId) {
      localStorage.setItem("currentWorkspaceId", currentWorkspaceId);
    } else {
      localStorage.removeItem("currentWorkspaceId");
    }
  }, [currentWorkspaceId]);

  useEffect(() => {
    if (currentUpload) {
      localStorage.setItem("currentUpload", currentUpload);
    } else {
      localStorage.removeItem("currentUpload");
    }
  }, [currentUpload]);

  useEffect(() => {
    if (currentMeasurement) {
      localStorage.setItem("currentMeasurement", currentMeasurement);
    } else {
      localStorage.setItem("currentMeasurement", "0");
    }
  }, [currentMeasurement]);

  const contextValue = useMemo(
    () => ({
      hdf5Data,
      setHdf5Data,
      isParsing,
      setIsParsing,
      setCurrentUpload,
      currentUpload,
      setCurrentMeasurement,
      currentMeasurement,
      hdf5Metadata,
      setHdf5Metadata,
      bin,
      setBin,
      confidence,
      setConfidence,

      // CPA
      cpaData,
      setCpaData,
      cpaResults,
      setCpaResults,
      setCpaResultForMeasurement,
      clearCpaResults,
      cpaProcessingIds,
      setCpaProcessingIds,
      getAllResolvedLevels,

      setCurrentWorkspaceId,
      currentWorkspaceId,
      groupingData,
      setGroupingData,
      currentUploadName,
      setCurrentUploadName,
      heatMapColor,
      setHeatMapColor,
      selectedMeasurements,
      toggleSelectedmeasurement,
      selectAllmeasurements,
      clearSelectedMeasurements,
      spectraHeatMapColor,
      setSpectraHeatMapColor,
      getPluginResult,
      setPluginResult,
      clearPluginResults,
      correlationData,
      setCorrelationData,
    }),
    [
      hdf5Data,
      isParsing,
      hdf5Metadata,
      currentUpload,
      currentMeasurement,
      bin,
      confidence,
      cpaData,
      setCpaData,
      cpaResults,
      setCpaResultForMeasurement,
      clearCpaResults,
      cpaProcessingIds,
      getAllResolvedLevels,
      currentWorkspaceId,
      groupingData,
      currentUploadName,
      heatMapColor,
      selectedMeasurements,
      spectraHeatMapColor,
      getPluginResult,
      setPluginResult,
      clearPluginResults,
      correlationData,
    ],
  );

  return (
    <Hdf5DataContext.Provider value={contextValue}>
      {children}
    </Hdf5DataContext.Provider>
  );
}

export function useHdf5Data() {
  const ctx = useContext(Hdf5DataContext);
  if (!ctx) throw new Error("useHdf5Data must be used within Hdf5DataProvider");
  return ctx;
}