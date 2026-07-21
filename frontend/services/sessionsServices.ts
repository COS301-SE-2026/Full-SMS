import axiosInstance from "@/lib/api/axiosInstance"

export const sessionsService = {
    saveSession: async(userId: string, sessionData: object) =>{
        try{
            const response = await axiosInstance.post(`/api/py/sessions/`,sessionData, {params: {user_id: userId}})
            return response.data
        }catch(error: any){
            throw new Error(
                error.response?.data?.detail || "Failed to save session",
            );
        } 
    },

    getSessions: async(userId: string) =>{
        try{
            const response = await axiosInstance.get(`/api/py/sessions`, {params: {user_id: userId}})
            return response.data
        }catch(error: any){
            throw new Error(
                error.response?.data?.detail || "Failed to get sessions",
            );
        }
    },

    getSessionsById: async(userId: string, sessionId: string) =>{
        try{
            const response = await axiosInstance.get(`/api/py/sessions/${sessionId}`, {params: {user_id: userId}})
            return response.data
        }catch(error: any){
            throw new Error(
                error.response?.data?.detail || "Failed to fetch session",
            );
        }

    },

}


