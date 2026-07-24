"use client";

import { useExportform } from "./export-usageForm";
import { Button, Card, CardHeader, CardTitle, CardContent, Checkbox } from "@/components/ui";


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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <Card>

                    <CardHeader>
                        <CardTitle>Data Export</CardTitle>
                    </CardHeader>

                    <CardContent className="flex flex-col gap-3">
                        <Checkbox label= "Intensity Plot Data" checked={form.exportIntensity} onCheckedChange={form.setExportIntensity} />
                        <Checkbox label= "Levels (change points)" checked={form.exportLevels} onCheckedChange={form.setLevels} />
                        <Checkbox label= "Groups (clusters)" checked={form.exportGroups} onCheckedChange={form.setGroups} />
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    ); 
}