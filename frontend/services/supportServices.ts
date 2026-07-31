import axiosInstance from "@/lib/api/axiosInstance"

export const supportService = {
    sendEmail: async(userEmail:string, message:string) =>{
        try{
            const response = await axiosInstance.post(`/api/py/support/`, {}, {params: {user_email: userEmail, message: message}})
            return response.data
        }catch(error: any){
            throw new Error(
                error.response?.data?.detail || "Failed to send email",
            );
        } 
    },
}


