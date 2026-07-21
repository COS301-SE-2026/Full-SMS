"use client"
import { useState } from "react";
import { useHdf5Data } from "@/contexts/hdf5Context/Hdf5DataContext";

export function useExportform() {
    const {
        currentUpload,
        currentMeasurement,
        bin,
        selectedMeasurements,
        selectAllmeasurements,
        clearSelectedMeasurements,
    } = useHdf5Data();

    return {
        selectedMeasurements,
        selectAllmeasurements,
        clearSelectedMeasurements,
    };
}