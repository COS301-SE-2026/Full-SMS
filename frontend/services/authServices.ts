import axiosInstance from "@/lib/api/axiosInstance";

export const authService = {
  //This calls the backend to verify that the Supabase JWT token is valid.
  verifyToken: async (): Promise<{
    valid: boolean;
    user_id?: string;
    email?: string;
  }> => {
    try {
      const response = await axiosInstance.post("/api/py/auth/verify-token");
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.detail || "Token verification failed",
      );
    }
  },
};
