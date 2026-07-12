import { useEffect, useState } from 'react';
import { Play, Maximize2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { cn } from '@/lib/utils';
import { useHdf5Data } from '@/contexts/Hdf5DataContext';
import { resolve } from 'path';
import { changePointAnalysis, changePoint_Req } from '@/services/analysisServices';
import { ChangePointResult } from '@/types/intensity';
import { log } from 'console';
import { Loader } from '../ui';

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
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
        className="w-24 h-1.5 rounded-lg appearance-none bg-border cursor-pointer accent-primary "
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

type Confidence = 69 | 90 | 95 | 99
function ConfidenceField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: Confidence;
  onChange: (v: Confidence) => void;
}) {
  const choices: Confidence[] =[69, 90, 95, 99];

  return (
    <div className="flex items-center gap-2">
      <label className="text-xs text-foreground/70 whitespace-nowrap">{label}</label>
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
  const {bin, setBin, confidence, setConfidence, currentUpload, currentMeasurement, setCpaData, cpaData} = useHdf5Data()
  const [scope, setScope] = useState<'selected' | 'all'>('selected');
  const [isLoading, setIsLoading] = useState(false)

  const resolveCurrent= async ()=>{
    const request: changePoint_Req ={
      upload_id: currentUpload,
      measurement_id:currentMeasurement,
      confidence: confidence
    }

    const response =  await changePointAnalysis(request);
    console.log(response);
    setCpaData(response)
    setIsLoading(false);
  }

  const OnResolveClick = () =>{
    if(!(currentMeasurement === "0")){
      const cpa = resolveCurrent()
      setIsLoading(true)      
    }
    else{
      console.log("No measurement selected")
    }
  }

  return (
    <div className="flex items-center gap-4 h-12 px-4 border-b border-border bg-background flex-wrap">
      <h3 className="text-foreground">Intensity Analysis</h3>

      <NumberField label="Bin (ms)" value={bin} onChange={setBin} />
      <ConfidenceField label="Confidence %" value={confidence} onChange={setConfidence} />

      <Button
        size="sm"
        variant="primary"
        leftIcon={(isLoading ? (<Loader size="sm" variant='dark'/>):(<Play size={14} fill="currentColor" />))}
        className="min-h-[28px] px-3"
        onClick={()=>OnResolveClick()}
      >
        Resolve Current
      </Button>

      <div className="flex rounded overflow-hidden border border-border">
        <button
          onClick={() => setScope('selected')}
          className={cn(
            'px-3 h-7 text-xs transition-colors',
            scope === 'selected'
              ? 'bg-primary text-background'
              : 'bg-card text-foreground hover:bg-border'
          )}
        >
          Selected (1)
        </button>
        <button
          onClick={() => setScope('all')}
          className={cn(
            'px-3 h-7 text-xs transition-colors border-l border-border',
            scope === 'all'
              ? 'bg-primary text-background'
              : 'bg-card text-foreground hover:bg-border'
          )}
        >
          All
        </button>
      </div>

      <span className="text-xs text-foreground/70">Show levels</span>

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
  );
}
