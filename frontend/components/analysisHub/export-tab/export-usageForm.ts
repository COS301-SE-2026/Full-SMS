"use client"
import { useState } from "react";
import { useHdf5Data } from "@/contexts/hdf5Context/Hdf5DataContext";
import { ExportFormat, PLotFormat } from "./File_formats";

export function useExportform() {
    const {
        currentUpload,
        currentMeasurement,
        hdf5Metadata,
        bin,
    } = useHdf5Data();
}