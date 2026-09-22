export type HistoryTab = | "intensity" | "lifetime" | "correlation" | "grouping" | "raster" | "spectra";

export interface HistoryEntry {
    id: string;
    workspace_id: string;
    upload_id: string;
    measurement_id: string | null;
    tab: HistoryTab;
    parameter: string;
    old_value: any;
    new_value: any;
    author_id: string;
    created_at: string;
}