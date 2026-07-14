export interface Level {
    start_index: number;
    end_index: number;
    start_time_ns: number;
    end_time_ns: number;
    num_photons: number;
    intensity_cps: number;
    group_id: number | null; 
}

export interface ChangePointResult {
    measurement_id: string;
    num_change_points: number;
    change_point_indices: number[];
    confidence_regions: [number, number][]; 
    levels: Level[];
}