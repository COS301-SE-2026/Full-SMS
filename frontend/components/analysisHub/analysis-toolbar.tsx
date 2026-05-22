import { useState } from 'react';
import { Play, Maximize2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { cn } from '@/lib/utils';

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <label className="text-xs text-foreground/70 whitespace-nowrap">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-16 h-7 px-2 rounded bg-card border border-border text-xs text-foreground text-right font-mono focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
      />
    </div>
  );
}

export function AnalysisToolbar() {
  const [bin, setBin] = useState('10');
  const [confidence, setConfidence] = useState('99');
  const [scope, setScope] = useState<'selected' | 'all'>('selected');

  return (
    <div className="flex items-center gap-4 h-12 px-4 border-b border-border bg-background flex-wrap">
      <h3 className="text-foreground">Intensity Analysis</h3>

      <NumberField label="Bin (ms)" value={bin} onChange={setBin} />
      <NumberField label="Confidence %" value={confidence} onChange={setConfidence} />

      <Button
        size="sm"
        variant="primary"
        leftIcon={<Play size={14} fill="currentColor" />}
        className="min-h-[28px] px-3"
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
