import axiosInstance from "@/lib/api/axiosInstance";

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
    levels: LevelData[]
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


export const intensityAnalysis = async (payload: Intensity_Req)=>{    
   const {data} = await axiosInstance.post('api/py/analysis/intensity', payload);
   return data;
}

export const changePointAnalysis = async (payload: changePoint_Req) =>{
    console.log("cpa payload", payload);
    
    const {data} = await axiosInstance.post('api/py/analysis/change-point-analysis', payload)
    console.log("change_point_data: " ,data)
    return data
}

export const getClusteringLevels = async (payload:ClusteringReq) =>{
    const {data} = await axiosInstance.post('api/py/analysis/group-current', payload)
    return data
}
