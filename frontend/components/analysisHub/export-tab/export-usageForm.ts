"use client"
import { useState } from "react";
import { useHdf5Data } from "@/contexts/hdf5Context/Hdf5DataContext";
import { ExportFormat, PLotFormat } from "./File_formats";


export function useExportform() {
    const {
        currentUpload,
        currentMeasurement,
        bin,
        selectedMeasurements,
        selectAllmeasurements,
        clearSelectedMeasurements,
        hdf5Metadata,
    } = useHdf5Data();

    const [exportIntensity, setExportIntensity] = useState(true);
    const [exportLevels, setLevels] = useState(true);
    const [exportGroups, setGroups] = useState(true);

    const [plotIntensity, setPlotIntensity] = useState(true);
    const [plotIncludeLevels, setPlotIncludeLevels] = useState(true);
    const [plotIncludeGroups, setPlotIncludeGroups] = useState(false);
    const [BICPlot, setBICPlot] = useState(false);

    const [dataFormat, setFormat] = useState<ExportFormat>("csv");
    const[PlotfileFormat, setPlotFormat] = useState<PLotFormat>("png");
    const[plotDPI, setPlotDPI] = useState(150);

    const [useBin, setUseBin] = useState(true);
    const [Binsize, setBinsize] = useState(10.000);
    const binSizeMeasure = useBin? bin : Binsize;

    const[isExporting, setIsExporting] = useState(false);
    const [statusMsg, setStatusMsg] = useState<string | null> (null);
    const [errorMsg, setErrorMsg] = useState<string | null> (null);

    async function startExporting(mode: "current" | "selected" | "all") {
        if (!currentUpload) {
            setErrorMsg("Upload a file before exporting");
            return;
        }

        let exportMeasurements : string[] = [];
        if(mode === "current") {
            if(!currentMeasurement || currentMeasurement === "0") {
                setErrorMsg("Select a measurement first.");
                return;
            }
            exportMeasurements = [currentMeasurement];
        }else if(mode === "selected") {
            if(selectedMeasurements.size === 0) {
                setErrorMsg("Select at least one measurement from the sidebar.");
                return;
            }
            exportMeasurements = Array.from(selectedMeasurements);
        }else{
            const totalMeasurements = hdf5Metadata?.num_measurements ?? 0;

            if(totalMeasurements === 0) {
                setErrorMsg("No measurements found in this upload.");
                return;
            }
            exportMeasurements = [];
            for (let i =1; i <= totalMeasurements; i++){
                exportMeasurements.push(i.toString()); 
            }
        }
        setErrorMsg(null);
        setIsExporting(true);
        setStatusMsg( `Exporting ${exportMeasurements.length} measurement(s)...`);

        const selections = exportMeasurements.map((measurementID) => ({
            measurement_id: measurementID, channel: 1
        }));

        const requestbody = {
            upload_id: currentUpload,
            selections: selections,
            format: dataFormat,
            bin_size_ms: binSizeMeasure,
            export_intensity: exportIntensity,
            export_levels: exportLevels,
            export_groups: exportGroups,

            plot_format: PlotfileFormat,
            plot_dpi: plotDPI,
            plot_intensity: plotIntensity,
            plotIntensity_levels: plotIncludeLevels,
            plotIntensity_groups: plotIncludeGroups,
            plot_bic: BICPlot,
        };

        try {
            const response = await fetch("/api/export", {
                method: "POST",
                headers: { "Content-Type": "application/json"},
                body: JSON.stringify(requestbody),
            });

            if(!response.ok) {
                if(response.status === 501) {
                    throw new Error("Something in this selection is not available on the server yet.");

                }
                if(response.status === 400) {
                    throw new Error("Select at least one export option before exporting.");

                } 
                throw new Error("Export failed. Please try again.");               
            }

            const dispose = response.headers.get("Content-Disposition");
            const filenameMatch = dispose?.match(/filename="?([^"]+)"?/);
            const downloadFilename = filenameMatch?.[1] ?? "export";

            const BlobforFile = await response.blob();
            const downloadURL = URL.createObjectURL(BlobforFile);

            const link = document.createElement("a");
            link.href = downloadURL;
            link.download = downloadFilename;
            link.click();

            URL.revokeObjectURL(downloadURL);

            setStatusMsg("Done");
        } catch (error){
            if(error instanceof Error) {
                setErrorMsg(error.message);
            } else{ setErrorMsg("Something went wrong.");}
          setStatusMsg(null);
        } finally{
            setIsExporting(false);
        }
        

    }
     




    return {
        selectedMeasurements,
        selectAllmeasurements,
        clearSelectedMeasurements,
        exportIntensity,
        setExportIntensity,
        exportLevels,
        setLevels,
        exportGroups,
        setGroups,
        plotIntensity,
        setPlotIntensity,
        plotIncludeLevels,
        setPlotIncludeLevels,
        plotIncludeGroups,
        setPlotIncludeGroups,
        BICPlot,
        setBICPlot,
        plotDPI,
        setPlotDPI,
        dataFormat,
        setFormat,
        useBin,
        setUseBin,
        Binsize,
        setBinsize,
        binSizeMeasure,
        isExporting,
        statusMsg,
        errorMsg,
        startExporting,
        
    };

}