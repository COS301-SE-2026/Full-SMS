import axiosInstance from "@/lib/api/axiosInstance"
import { OnedriveAcessToken } from "@/types/auth"


export const get_access_token = async () =>{
    return axiosInstance.post('api/py/cloud/onedrive/token');
}