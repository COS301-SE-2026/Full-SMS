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
    } = useHdf5Data();

    const [exportIntensity, setExportIntensity] = useState(true);
    const [exportLevels, setLevels] = useState(true);
    const [exportGroups, setGroups] = useState(true);

    const [plotIntensity, setPlotIntensity] = useState(true);
    const [plotIncludeLevels, setPlotIncludeLevels] = useState(true);
    const [plotIncludeGroups, setPlotIncludeGroups] = useState(false);
    const [BICPlot, setBICPlot] = useState(false);

    const [dataFormat, setFormat] = useState<ExportFormat>("csv");
    const[PlotFormat, setPlotFormat] = useState<PLotFormat>("png");
    const[plotDPI, setPlotDPI] = useState(150);







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
    };

}