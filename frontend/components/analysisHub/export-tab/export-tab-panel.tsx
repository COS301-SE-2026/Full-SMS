"use client";

import { useExportform } from "./export-usageForm";

export default function ExportPanel() {
    const form = useExportform();

    return (
        <div className="flex h-full min-h-[640px] bg-background text-foreground">
            <main className="flex-1 p-6 overflow-y-auto">
                <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                    <h3 className="text-foreground">Export</h3>
                    <div className = "flex items-center gap-2 text-sm text-foreground/60">
                    
                    </div>
                </div>
            </main>
        </div>
    ); 
}