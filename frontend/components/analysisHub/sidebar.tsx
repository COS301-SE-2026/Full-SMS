import { useState } from 'react';
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

const navItems = [
  { icon: Activity, label: 'Intensity', key: 'intensity' },

];

export function Sidebar() {
  const [active, setActive] = useState('intensity');
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

      {/* Navigation */}
      <nav className="flex flex-col py-1">
        {navItems.map(({ icon: Icon, label, key }) => {
          const isActive = key === active;
          return (
            <button
              key={key}
              onClick={() => setActive(key)}
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

      {/* Measurements */}
      <MeasurementsBar />
    </aside>
  );
}
