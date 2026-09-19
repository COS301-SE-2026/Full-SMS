import { useState } from "react";
import { Play, Maximize2 } from "lucide-react";
import { Button } from "../../ui/Button";
import { useHdf5Data } from "@/contexts/hdf5Context/Hdf5DataContext";
import { changePoint_Req } from "@/types/analysis";
import { changePointAnalysis } from "@/services/analysisServices";
import { Loader } from "../../ui";
import { useToast } from "@/contexts/toastContext/ToastContext";
import { AnalysisProgress } from "../analysisProgress";

export function NumberField({
  label,
  value,
  onChange,
  slider = true,
}: {
  label: string;
  value: number;
  slider?: boolean;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <label className="text-xs text-foreground/70 whitespace-nowrap">
        {label}
      </label>

      <input
        type="range"
        min={0.1}
        max={1000}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className={`w-24 h-1.5 rounded-lg appearance-none bg-border cursor-pointer accent-primary ${slider ? "hidden" : ""}`}
      />

      <input
        type="number"
        min={1}
        max={1000}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-16 h-7 px-2 rounded bg-card border border-border 
        text-xs text-foreground text-right font-mono focus-visible:outline-none 
        focus-visible:ring-1 focus-visible:ring-primary 
        [appearance:textfield] 
        [&::-webkit-outer-spin-button]:appearance-none and 
        [&::-webkit-inner-spin-button]:appearance-none
        [&::-webkit-inner-spin-button]:m-0"
      />
    </div>
  );
}

type Confidence = 69 | 90 | 95 | 99;
function ConfidenceField({
  label,
  value,
  onChange,
}: {
  readonly label: string;
  readonly value: Confidence;
  readonly onChange: (v: Confidence) => void;
}) {
  const choices: Confidence[] = [69, 90, 95, 99];

  return (
    <div className="flex items-center gap-2">
      <label className="text-xs text-foreground/70 whitespace-nowrap">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(Number(e.target.value) as Confidence)}
        className="w-20 h-7 px-2 rounded bg-card border border-border text-xs text-foreground text-right font-mono focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary appearance-none cursor-pointer"
      >
        {choices.map((num) => (
          <option key={num} value={num}>
            {num}
          </option>
        ))}
      </select>
    </div>
  );
}

export function AnalysisToolbar() {
  const {
    bin,
    setBin,
    confidence,
    setConfidence,
    currentUpload,
    currentMeasurement,
    setCpaData,
    selectedChannels,
    selectAllChannels,
    selectAllMeasurements,
    selectedMeasurements,
    setCpaResultForMeasurement,
    cpaResults,
    setCpaProcessingIds,
    cpaProcessingIds,
    hdf5Metadata,
  } = useHdf5Data();
  const { errorToast, successToast } = useToast();

  const [isLoading, setIsLoading] = useState(false);

  const resolveCurrent = async () => {
    const request: changePoint_Req = {
      upload_id: currentUpload,
      measurement_id: currentMeasurement,
      confidence: confidence,
    };

    const response = await changePointAnalysis(request);
    console.log(response);
    setCpaData(response);
    setIsLoading(false);
  };

  const OnResolveCurrentClick = () => {
    if (currentMeasurement !== "0") {
      resolveCurrent();
      setIsLoading(true);
    } else {
      console.log("No measurement selected");
    }
  };

  const resolveSelected = async () => {
    if (selectedMeasurements.size === 0) return;
    const ids = Array.from(selectedMeasurements);
    setCpaProcessingIds(new Set(ids));
    setIsLoading(true);
    for (const mId of ids) {
      const request: changePoint_Req = {
        upload_id: currentUpload,
        measurement_id: mId,
        confidence: confidence,
      };
      try {
        const response = await changePointAnalysis(request);
        setCpaResultForMeasurement(mId, response);
      } catch (e) {
        console.error(`CPA failed for measurement ${mId}`, e);
      }
      setCpaProcessingIds((prev) => {
        const next = new Set(prev);
        next.delete(mId);
        return next;
      });
    }
    setIsLoading(false);
  };

  const resolveAll = async () => {
    const summaries = hdf5Metadata?.measurements_summary;
    if (!summaries || summaries.length === 0) return;
    const ids = summaries.map((m) => m.id.toString());
    setCpaProcessingIds(new Set(ids));
    setIsLoading(true);
    for (const mId of ids) {
      const request: changePoint_Req = {
        upload_id: currentUpload,
        measurement_id: mId,
        confidence: confidence,
      };
      try {
        const response = await changePointAnalysis(request);
        setCpaResultForMeasurement(mId, response);
      } catch (e) {
        console.error(`CPA failed for measurement ${mId}`, e);
      }
      setCpaProcessingIds((prev) => {
        const next = new Set(prev);
        next.delete(mId);
        return next;
      });
    }
    setIsLoading(false);
  };

  const onResolveAllClick = () => {
    resolveAll();
  };

  const onResolveSelectedClick = () => {
    if (selectedMeasurements.size === 0) {
      errorToast("No measurements selected");
      return;
    }
    resolveSelected();
  };

  const summary = hdf5Metadata?.measurements_summary?.filter( summ => (summ.id).toString() === currentMeasurement)
  
  return (
    <div className="flex flex-col border-b border-border bg-background flex-wrap  px-4 ">
      <div className="flex items-center gap-4 h-12">
        <h3 className="text-foreground">Intensity Analysis</h3>

        <NumberField label="Bin (ms)" value={bin} onChange={setBin} />
        <ConfidenceField
          label="Confidence %"
          value={confidence}
          onChange={setConfidence}
        />

        <Button
          size="sm"
          variant="primary"
          disabled={isLoading}
          className="min-h-[28px] px-3"
          onClick={() => OnResolveCurrentClick()}
        >
          Resolve Current
        </Button>
        <Button
          size="sm"
          variant="primary"
          disabled={isLoading}
          className="min-h-[28px] px-3"
          onClick={() => onResolveAllClick()}
        >
          Resolve All
        </Button>

        <Button
          size="sm"
          variant="primary"
          disabled={isLoading}
          className="min-h-[28px] px-3"
          onClick={() => onResolveSelectedClick()}
        >
          Resolve Selected
        </Button>
        <div className="ml-auto">
          <Button
            size="sm"
            variant="secondary"
            leftIcon={<Maximize2 size={14} />}
            className="min-h-[28px] px-3"
          >
            Fit View
          </Button>
        </div>
      </div>
        <div>
          {isLoading && (
            <span className="font-mono text-sm text-primary animate-pulse">
              Resolving {cpaProcessingIds.size} Measurements ...
            </span>
          )}
          {currentMeasurement in cpaResults && <p className="text-success text-xs font-mono">{cpaResults[currentMeasurement].levels?.length} levels</p>}
        </div>
    </div>
  );
}
