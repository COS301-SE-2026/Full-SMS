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

export const intensityAnalysis = async (payload: Intensity_Req)=>{    
   const {data} = await axiosInstance.post('api/py/analysis/intensity', payload);
   return data;
}
