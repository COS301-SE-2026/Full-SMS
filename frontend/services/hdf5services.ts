import axiosInstance from "@/lib/api/axiosInstance";

export const uploadFile = async (
  file: File,
  onProgress?: (pct: number) => void
) => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await axiosInstance.post("/api/py/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress: (evt) => {
      if (!evt.total) return;
      const pct = Math.round((evt.loaded / evt.total) * 100);
      onProgress?.(pct);
    },
  });

  return response.data;
};

export const readHdf5 = async (file: File) => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await axiosInstance.post("/api/py/hdf5/read", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return response.data;
};