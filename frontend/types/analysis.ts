// export interface Level {
//     start_index: number;
//     end_index: number;
//     start_time_ns: number;
//     end_time_ns: number;
//     num_photons: number;
//     intensity_cps: number;
//     group_id: number | null; 
// }

import { boolean, number } from "yup";

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
    bic:number,
    groups: GroupData[];
    level_group_assignments: number[];
    num_groups: number;
}

export type ClusteringRes ={
    steps: ClusteringStep[],
    optimal_step_index: number,
    selected_step_index: number,
    num_original_levels: number
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

export type SpectraData = {
    z: number[][],
    rows: number ,
    cols: number,
    bounds_min :[number, number],
    bounds_max :[number, number],
    scale_min :number,
    scale_max :number,
    exposure_time: number
}

export type LifetimeReq = {
    t: Float64Array | number[];
    counts: BigInt64Array | number[]; // Use BigInt64Array for exact 64-bit ints, or number[] if within safe limits
    channelwidth: number;
    irf?: Float64Array | number[] | null;
    num_exponentials?: number; // Default: 1
    tau_init?: number | number[] | null;
    tau_bounds?: [number, number] | null;
    amp_init?: number[] | null;
    amp_bounds?: [number, number] | null;
    shift_init?: number; // Default: 0.0
    shift_bounds?: [number, number] | null;
    start?: number | null;
    end?: number | null;
    autostart?: StartpointMode; // Default: StartpointMode.MANUAL
    autoend?: boolean; // Default: false
    background?: number | null;
    irf_background?: number | null;
    settings?: FitSettings | null;
    fit_irf_fwhm?: boolean; // Default: false
    irf_fwhm_init?: number | null;
    irf_fwhm_bounds?: [number, number] | null;
}

export enum StartpointMode {
  MANUAL = "Manual",
  CLOSE_TO_MAX = "(Close to) max",
  RISE_MIDDLE = "Rise middle",
  RISE_START = "Rise start",
  SAFE_RISE_START = "Safe rise start",
}

export type FitSettings = {
    use_moving_avg: boolean//default true
    moving_avg_window: number //default 10
    start_percent: number //default 80
    end_multiple: number //default 20
    end_percent: number //default 1
    minimum_decay_window_ns: number //default 2
    bg_percent: number //default 5
}

// t: Time axis in nanoseconds.
// counts: Photon counts per channel.
// channelwidth: TCSPC channel width in nanoseconds.
// irf: Instrument response function. If None, a delta function is used.
// num_exponentials: Number of exponential components (1, 2, or 3).
// tau_init: Initial guess for lifetime(s) in nanoseconds. For multi-exponential
//     fits, provide a list with one value per component.
// tau_bounds: Bounds for tau as (min, max) in nanoseconds. Applies to all components.
// amp_init: Initial guess for amplitudes. Only used for multi-exponential fits.
//     Amplitudes are normalized so they sum to 1.
// amp_bounds: Bounds for individual amplitudes as (min, max). Default is (0, 1).
// shift_init: Initial guess for IRF shift in channels.
// shift_bounds: Bounds for shift as (min, max) in channels.
// start: Manual start point (channel index).
// end: Manual end point (channel index).
// autostart: Mode for automatic start detection.
// autoend: Whether to automatically determine end point.
// background: Pre-calculated decay background.
// irf_background: Pre-calculated IRF background.
// settings: Fit settings.
// fit_irf_fwhm: Whether to fit the IRF FWHM (only for simulated IRF).
// irf_fwhm_init: Initial guess for IRF FWHM in nanoseconds.
// irf_fwhm_bounds: Bounds for FWHM as (min, max) in nanoseconds.



