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
            measurement_id: Number(measurementID), channel: 1
        }));

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