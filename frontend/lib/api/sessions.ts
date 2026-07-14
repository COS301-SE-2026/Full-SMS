import axiosInstance from "./axiosInstance";

//post for saving a session
export const saveSession = async(userId: string, sessionData: object) =>{
    try{
        const response = await axiosInstance.post(`/api/py/sessions`,sessionData, {params: {user_id: userId}})
        return response.data
    }catch (error){
        throw error
    }
}

//get sessions
export const getSessions = async(userId: string) =>{
    try{
        const response = await axiosInstance.get(`/api/py/sessions`, {params: {user_id: userId}})
        return response.data
    }catch(error){
        throw error
    }
}


