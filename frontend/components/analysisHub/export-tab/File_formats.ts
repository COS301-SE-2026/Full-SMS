export type ExportFormat= "csv" | "parquet" | "excel" | "json" ;

export const FORMAT_OPTIONS: { value: ExportFormat; label: string} [] = [
    {value: "csv", label: "CSV"},
    {value: "parquet", label: "Parquet"},
    {value: "excel", label: "Excel (.xlsx)"},
    {value: "json", label: "JSON"},
];

