'use client';


import {  ChevronDown,
  ChevronRight,
  FileText,
  Radio,
} from 'lucide-react';
import React, { useState } from 'react'
import { cn } from '@/lib/utils';
import { Measurement } from '@/types/hdf5';
import { useHdf5Data } from '@/contexts/Hdf5DataContext'

export function MeasurementsBar() {

  const [measurements, setMeasurements] = useState<Measurement[]>();
  const { hdf5Data } = useHdf5Data()

  React.useEffect(() => {
    if (hdf5Data) {
      const m = hdf5Data.measurements.map((x) => ({
        name: x.name,
        checked: false,
        expanded: false,
        channels: x.channelWidth > 1 ? Array.from({ length: x.channelWidth }, (_, i) => `Channel ${i + 1}`) : undefined,
      }));
      setMeasurements(m);
    }
  }, [hdf5Data]);

  console.log("MeasurementsBar - measurements:", measurements);

  const toggleCheck = (i: number) =>
    setMeasurements((m) =>
      m?.map((x, idx) => (idx === i ? { ...x, checked: !x.checked } : x))
    );

  const toggleExpand = (i: number) =>
    setMeasurements((m) =>
      m?.map((x, idx) => (idx === i ? { ...x, expanded: !x.expanded } : x))
    );

  return (
    <div className="flex flex-col border-t border-border overflow-hidden">
      <div className="mt-3 px-3.5 flex items-center justify-between">
        <span className="text-xs text-foreground/60 tracking-wider">MEASUREMENTS</span>
        <button className="text-xs text-foreground/60 hover:text-primary">All</button>
      </div>

      <div className="flex flex-col mt-1 overflow-y-auto flex-1">
        {measurements?.map((m, i) => (
          <div key={m.name}>
            <div className="flex items-center gap-1.5 px-3.5 py-1 hover:bg-card cursor-pointer">
              {m.channels ? (
                <button
                  onClick={() => toggleExpand(i)}
                  className="text-foreground/60 hover:text-foreground"
                >
                  {m.expanded ? (
                    <ChevronDown size={12} />
                  ) : (
                    <ChevronRight size={12} />
                  )}
                </button>
              ) : (
                <span className="w-3" />
              )}
              <input
                type="checkbox"
                checked={m.checked}
                onChange={() => toggleCheck(i)}
                className="accent-primary w-3 h-3"
              />
              <FileText size={12} className="text-foreground/70" />
              <span
                className={cn(
                  'text-xs truncate',
                  m.checked ? 'text-primary' : 'text-foreground'
                )}
              >
                {m.name}
              </span>
            </div>
            {m.expanded &&
              m.channels?.map((c) => (
                <div
                  key={c}
                  className="flex items-center gap-1.5 pl-9 pr-3.5 py-1 hover:bg-card cursor-pointer"
                >
                  <Radio size={12} className="text-foreground/70" />
                  <span className="text-xs text-foreground flex-1">{c}</span>
                  <span className="text-xs text-foreground/40">L</span>
                </div>
              ))}
          </div>
        ))}
      </div>
    </div>
  )
}

