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
    };

}