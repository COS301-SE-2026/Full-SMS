import axiosInstance from "./axiosInstance";

//post for saving a session
export const saveSession = async(userId: string, sessionData: object) =>{
    const response = await axiosInstance.post(`/api/py/sessions`,sessionData, {params: {user_id: userId}})
    return response.data
}

//get sessions
export const getSessions = async(userId: string) =>{
    const response = await axiosInstance.get(`/api/py/sessions`, {params: {user_id: userId}})
    return response.data
}

//get sessions by id
export const getSessionsById = async(userId: string, sessionId: string) =>{
    const response = await axiosInstance.get(`/api/py/sessions/${sessionId}`, {params: {user_id: userId}})
    return response.data
}


