"use client";

import { useExportform } from "./export-usageForm";
import { Button } from "@/components/ui";

export default function ExportPanel() {
    const form = useExportform();

    return (
        <div className="flex h-full min-h-[640px] bg-background text-foreground w-full">
            <main className="flex-1 p-6 overflow-y-auto">
                <div className="flex items-center justify-between mb-4 gap-2">
                    <h3 className="text-foreground">Export</h3>
                    <div className = "flex items-center gap-2 text-sm text-foreground/60">
                        <span>{form.selectedMeasurements.size} of {form.totalMeasurements} Measurements selected</span>
                        
                        <Button variant="secondary" size="sm" onClick={() => form.selectAllmeasurements(form.totalMeasurements)}>
                            Select all
                        </Button>
                        <Button variant="secondary" size="sm" onClick={form.clearSelectedMeasurements}>
                            Clear 
                        </Button>
                    </div>
                </div>
            </main>
        </div>
    ); 
}