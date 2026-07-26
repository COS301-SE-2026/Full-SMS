"use client";
import {Download} from "lucide-react";
import { useExportform } from "./export-usageForm";
import { Button, Card, CardHeader, CardTitle, CardContent, Checkbox, Toggle, Input } from "@/components/ui";
import { FORMAT_OPTIONS, Plot_format_options } from "./File_formats";


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

                    <Card>
                        <CardHeader>
                            <CardTitle>Plot Export</CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-col gap-3">
                            <Checkbox label= "Intensity Plot" checked={form.plotIntensity} onCheckedChange={form.setPlotIntensity} />
                            <div className="ml-6 flex flex-col gap-2">
                                <Checkbox label= "Include Levels" checked={form.plotIncludeLevels} onCheckedChange={form.setPlotIncludeLevels} disabled={!form.plotIntensity}/>
                                <Checkbox label= "Include Groups ( contains Level Boundaries )" checked={form.plotIncludeGroups} onCheckedChange={form.setPlotIncludeGroups} disabled={!form.plotIntensity}/>
                            </div>

                            <Checkbox label= "BIC Plot" checked={form.BICPlot} onCheckedChange={form.setBICPlot} />

                        </CardContent>
                    </Card>  

                    <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle>Output settings</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 items-end">
                        <div className="flex flex-col gap-1">
                            <label className="text-base font-medium text-foreground">Data Format</label>
                            <select value={form.dataFormat}
                                onChange={(e) => form.setFormat(e.target.value as typeof form.dataFormat)}
                                className="min-h-[44px] px-3 py-2 rounded bg-card border border-border text-base text-foreground">
                                    {FORMAT_OPTIONS.map((option) => ( 
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                        ))}
                                </select>
                        </div>

                         <div className="flex flex-col gap-1">
                            <label className="text-base font-medium text-foreground">Plot Format</label>
                            <select value={form.PlotfileFormat}
                                onChange={(e) => form.setPlotFormat(e.target.value as typeof form.PlotfileFormat)}
                                className="min-h-[44px] px-3 py-2 rounded bg-card border border-border text-base text-foreground">
                                    {Plot_format_options.map((option) => ( 
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                        ))}
                                </select>
                        </div>

                        <Input
                            label = "Plot DPI"
                            type="number"
                            value={form.plotDPI}
                            disabled={form.PlotfileFormat !== "png"}
                            onChange={(e) => form.setPlotDPI(Number(e.target.value))}
                            helperText={form.PlotfileFormat !== "png" ? "Only used for PNG" : undefined}
                            className="w-28"/>
                        
                        <div className="flex items-end gap-4 ml-35">
                            <div className="flex flex-col gap-1 mb-2">
                                <Toggle 
                                    label = "Use bin size from Intensity tab"
                                    checked={form.useBin}
                                    onCheckedChange={form.setUseBin}
                                    className="whitespace-nowrap min-h-[44px] flex items-center"/>

                            </div>
                                
                            <Input
                                label = "Bin Size (ms)"
                                type="number"
                                value={form.useBin ? form.binSizeMeasure : form.Binsize}
                                disabled={form.useBin}
                                onChange={(e) => form.setBinsize(Number(e.target.value))}
                                className="w-28"/>
                        </div>
                    </CardContent>
                </Card>
                </div>
                <div className="flex gap-2 justify-end w-full mt-15">
                    <Button variant="secondary" onClick={() => form.startExporting("selected")} disabled={form.isExporting}>
                        Export selected ({form.selectedMeasurements.size})
                    </Button>
                    <Button 
                        variant="primary" 
                        loading={form.isExporting} 
                        leftIcon={<Download size={16} />} 
                        onClick={() => form.startExporting("current")}>
                            Export Current
                        </Button>
                </div>
                <div className="mt-4 text-right text-sm mr-3">
                    {form.errorMsg && (
                        <span className="text-destructive" role="alert">{form.errorMsg}</span>
                    )}
                    {!form.errorMsg && form.statusMsg && (
                        <span className="text-foreground/60">{form.statusMsg}</span>
                    )}
                </div>
            </main>
        </div>
    ); 
} 