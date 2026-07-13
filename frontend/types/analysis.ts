// export interface Level {
//     start_index: number;
//     end_index: number;
//     start_time_ns: number;
//     end_time_ns: number;
//     num_photons: number;
//     intensity_cps: number;
//     group_id: number | null; 
// }

export interface ChangePointResult {
    measurement_id: string;
    num_change_points: number;
    change_point_indices: number[];
    confidence_regions: [number, number][]; 
    levels: LevelData[] | undefined;
}


export type Intensity_Req = {
    upload_id: string;
    measurement_id: string;
    bin_size_ms: number
}

export type Intensity_Res = {
    time_bins: Float64Array;
    counts: Int8Array;  
    intensity_cps: Float64Array
}


export type changePoint_Req = {
    upload_id: string
    measurement_id: string
    confidence: number
}

export type ClusteringReq={
    levels: LevelData[] | undefined
} 

export interface GroupData {
    group_id: number;
    level_indices: number[];
    total_photons: number;
    total_dwell_time_s: number;
    intensity_cps: number;
}
export interface ClusteringStep {
    groups: GroupData[];
    level_group_assignments: number[];
    num_groups: number;
}

export type ClusteringRes ={
    steps: ClusteringStep[],

}

export type LevelData = {
    start_index: number
    end_index: number
    start_time_ns: number
    end_time_ns: number
    num_photons: number
    intensity_cps: number
    group_id?: number[]
}