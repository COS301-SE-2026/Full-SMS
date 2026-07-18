'use client'

import React from 'react';
import {
  Activity,
  Clock,
  Layers,
  GitCompare,
  Waves,
  Grid3x3,
  Download,
  ChevronLeft,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { MeasurementsBar } from './measurementsBar';
import { useAnalysisTab } from '@/contexts/analysisTabsContext/AnalysisTabsContext';
import { Panel, Group } from "react-resizable-panels";

const navItems = [
  { icon: Activity, label: 'Intensity', key: 'intensity' },
  {icon: Clock, label: "Lifetime", key: 'lifetime'},
  {icon: Layers, label: 'Grouping', key:'grouping'},
  {icon: Grid3x3, label: 'Raster', key: 'raster'},
  {icon: Waves, label: "Spectra", key: 'spectra'},
];

export function Sidebar() {
  const {activeTab, setActiveTab} = useAnalysisTab();
  return (
    <aside className="flex flex-col w-[195px] shrink-0 border-r border-border bg-background">
      {/* Header */}
      <div className="flex items-center justify-between h-[49px] px-3.5 border-b border-border">
        <h3 className="text-foreground">FullSMS</h3>
        <button
          className="p-1 rounded hover:bg-card text-foreground/70"
          aria-label="Collapse sidebar"
        >
          <ChevronLeft size={16} />
        </button>
      </div>
      <Group orientation="vertical">
        <Panel>
        <nav className="flex flex-col py-1 resize-y">
          {navItems.map(({ icon: Icon, label, key }) => {
            const isActive = key === activeTab;
            return (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={cn(
                  'flex items-center gap-2.5 px-3.5 py-2 text-sm transition-colors',
                  isActive
                    ? 'bg-primary text-background'
                    : 'text-foreground hover:bg-card'
                )}
              >
                <Icon size={18} />
                <span>{label}</span>
              </button>
            );
          })}
        </nav>
        </Panel>
        <Panel>
          <MeasurementsBar />
        </Panel>
      </Group>

    </aside>
  );
}
