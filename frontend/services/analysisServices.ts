import axiosInstance from "@/lib/api/axiosInstance";
import { changePoint_Req, ClusteringReq, Intensity_Req } from "@/types/analysis";


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

export const getRasterData = async (payload: any) =>{
    const {data} = await axiosInstance.post('api/py/analysis/raster-scan', payload)
    return data
}

export const getSpectraData = async (payload: any) =>{
    const {data} = await axiosInstance.post('api/py/analysis/spectra', payload)
    return data
}