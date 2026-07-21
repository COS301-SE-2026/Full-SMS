//data export formats 

export type ExportFormat= "csv" | "parquet" | "excel" | "json" ;

export const FORMAT_OPTIONS: { value: ExportFormat; label: string} [] = [
    {value: "csv", label: "CSV"},
    {value: "parquet", label: "Parquet"},
    {value: "excel", label: "Excel (.xlsx)"},
    {value: "json", label: "JSON"},
];



//plot export formats 
export type PLotFormat = "png" | "pdf" | "svg"

export const Plot_format_options: { value: PLotFormat;  label: string} []=[
    {value: "pdf", label: "PDF"},
    {value: "png", label: "PNG"},
    {value: "svg", label: "SVG"},
];