import { useEffect, useState } from "react";
import { Maximize2 } from "lucide-react";
import { Button } from "../../ui/Button";
import { useHdf5Data } from "@/contexts/hdf5Context/Hdf5DataContext";
import { changePoint_Req } from "@/types/analysis";
import { changePointAnalysis } from "@/services/analysisServices";
import { useToast } from "@/contexts/toastContext/ToastContext";

interface NumberFieldProps {
  readonly label: string;
  readonly value: number;
  readonly slider?: boolean;
  readonly min?: number;
  readonly max?: number;
  readonly onChange: (v: number) => void;
  readonly onMouseUp?: (v: number) => void;
}

export function NumberField({
  label,
  value,
  onChange,
  onMouseUp = () =>{},
  slider = true,
}: NumberFieldProps) {
  return (

    <div className="flex items-center gap-2">
      <label className="text-xs text-foreground/70 whitespace-nowrap">
        {label}
      </label>

      {slider && (<input
        type="range"
        min={0.1}
        max={1000}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        onPointerUp={(e) => onMouseUp(Number(e.currentTarget.value))}
        onKeyUp={(e)=> onMouseUp(Number(e.currentTarget.value))}
        className={`w-24 h-1.5 rounded-lg appearance-none bg-border cursor-pointer accent-primary`}
      />)}

      <input
        type="number"
        min={1}
        max={1000}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        onBlur={(e) => onMouseUp(Number(e.target.value))}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            onMouseUp(Number(e.currentTarget.value))
            }
          }}
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
    selectedMeasurements,
    setCpaResultForMeasurement,
    cpaResults,
    setCpaProcessingIds,
    cpaProcessingIds,
    hdf5Metadata,
    currentChannel,
    isMultiChannel,
    selectedChannels,
  } = useHdf5Data();
  const { errorToast } = useToast();
  const activeKey = `${currentMeasurement}:${currentChannel}`;
  const [isLoading, setIsLoading] = useState(false);
  const [localBinValue, setLocalBinValue] = useState<number>()

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLocalBinValue(bin);
  }, [bin]);




  const handleSliderRelease = (finalBinValue: number) =>{
    setBin(finalBinValue)
  }

  const resolveCurrent = async () => {
    const request: changePoint_Req = {
      upload_id: currentUpload,
      measurement_id: currentMeasurement,
      confidence: confidence,
      channel: currentChannel
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

  const resolve = async (mode: string) => {
    let ids: string[] = []
    if (mode === "selected") {
      ids = isMultiChannel
        ? Array.from(selectedChannels)
        : Array.from(selectedMeasurements);
      if (ids.length === 0) {
        errorToast(isMultiChannel ? "No channels selected" : "No measurements selected");
        return;
      }
    }
    else if (mode === "all") {
      const summaries = hdf5Metadata?.measurements_summary;
      if (!summaries || summaries.length === 0) return;
      if (isMultiChannel) {
        ids = summaries.flatMap((m) =>
          (m.channels ?? [1]).map((_, idx) => `${m.id}:${idx + 1}`)
        );
        console.log("MULTI CHANNEL IDS", ids);
        
      } else {
        ids = summaries.map((m) => m.id.toString());
      }
    }

    setCpaProcessingIds(new Set(ids));
    setIsLoading(true);
    for (const mId of ids) {
      let targetChannel = currentChannel
      let targetMeasuement = mId
      if (isMultiChannel && mId.includes(":")){
        const [meas, chnl] = mId.split(":")
        targetChannel=Number(chnl)
        targetMeasuement = meas
      }

      const request: changePoint_Req = {
        upload_id: currentUpload,
        measurement_id: targetMeasuement!,
        confidence: confidence,
        channel: targetChannel!
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
    // selectAllChannels()
    // console.log(selectedChannels);
    
    resolve("all");
  };

  const onResolveSelectedClick = () => {
    if (selectedMeasurements.size === 0) {
      errorToast("No measurements selected");
      return;
    }
    resolve("selected");
  };

  return (
    <div className="flex flex-col border-b border-border bg-background flex-wrap  px-4 ">
      <div className="flex items-center gap-4 h-12">
        <h3 className="text-foreground">Intensity Analysis</h3>

        <NumberField label="Bin (ms)" value={localBinValue!} onChange={setLocalBinValue} onMouseUp={handleSliderRelease} />
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
        {activeKey in cpaResults && (
          <p className="text-success text-xs font-mono">
            {cpaResults[activeKey].levels?.length} levels
          </p>
        )}
      </div>
    </div>
  );
}
