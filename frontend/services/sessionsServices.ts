import axiosInstance from "@/lib/api/axiosInstance"

export const sessionsService = {
    saveSession: async(sessionData: object) =>{
        try{
            const response = await axiosInstance.post(`/api/py/sessions/`,sessionData)
            return response.data
        }catch(error: any){
            throw new Error(
                error.response?.data?.detail || "Failed to save session",
            );
        } 
    },

    getSessions: async() =>{
        try{
            const response = await axiosInstance.get(`/api/py/sessions/`)
            return response.data
        }catch(error: any){
            throw new Error(
                error.response?.data?.detail || "Failed to get sessions",
            );
        }
    },

    getSessionsById: async(sessionId: string) =>{
        try{
            const response = await axiosInstance.get(`/api/py/sessions/${sessionId}`)
            return response.data
        }catch(error: any){
            throw new Error(
                error.response?.data?.detail || "Failed to fetch session",
            );
        }

    },

}


