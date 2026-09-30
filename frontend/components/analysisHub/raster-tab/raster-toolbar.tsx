import React from 'react'
import { useHdf5Data } from '@/contexts/hdf5Context/Hdf5DataContext'
import { useHistoryRecorder } from '@/hooks/useHistoryRecorder'
import{History, MessageSquare} from "lucide-react";
import { Button } from '@/components/ui';

export default function RasterToolbar({onHistoryRecorded, historyOpen, onToggleHistory, commentsOpen, onToggleComments}: {onHistoryRecorded: () => void; historyOpen:boolean; onToggleComments: () => void; commentsOpen: boolean; onToggleHistory: () => void }) {
    const {setHeatMapColor, heatMapColor, currentUpload, currentWorkspaceId} = useHdf5Data()
    const colourmaps = ["Plasma","Viridis", "Inferno", "Hot", "Cool", "Twilight"]
    const recordHistory = useHistoryRecorder(currentWorkspaceId, currentUpload, "raster", onHistoryRecorded);

    return (
    <div className="flex items-center gap-4 h-12 px-4 border-b border-border bg-background flex-wrap z-10">
    <h3 className="text-foreground">Raster</h3>
    <div className="flex items-center gap-2">
        <label className="text-xs text-foreground/70 whitespace-nowrap">Colormap</label>
            <select
            value={heatMapColor}
            onChange={(e) =>{
                setHeatMapColor(e.target.value);
                recordHistory("colormap", heatMapColor, e.target.value);
            }}
            className="w-20 h-7 px-2 rounded bg-card border border-border text-xs text-foreground text-right font-mono focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary appearance-none cursor-pointer"
            >
            {colourmaps.map((map) => (
            <option key={map} value={map}>
            {map}
            </option>
            ))}
        </select>
        </div>
        <Button variant="ghost" size="sm" 
            title="View Parameter history"
            onClick={onToggleHistory}
            className={`ml-auto ${historyOpen ? "bg-card" : ""}`}
            leftIcon={<History size={14} />}
            />

        <Button variant="ghost" size="sm" 
            title="View Notes"
            onClick={onToggleComments}
            className={`ml-auto px-2 py-0.5 min-h-0 ${commentsOpen ? "bg-card" : ""}`}
            leftIcon={<MessageSquare size={14} />}
            />
    </div>
    )
}
