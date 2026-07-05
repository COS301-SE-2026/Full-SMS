import axiosInstance from "@/lib/api/axiosInstance";

export type InitUploadResponse = {
  upload_id: string;
  storage_key: string;
  upload_url: string;
  url_expires_at: string;
  max_file_size_bytes: number;
}

export const initHdf5Upload = async (payload:{
  filename: string;
  size_bytes: number;
  content_type: string;
  sha256: string;
})=>{
  const {data} = await axiosInstance.post<InitUploadResponse>("api/py/hdf5/uploads/init", payload);
  return data;
}

export const uploadToSignedUrl = async (upload_url: string, Hfile: File, onProgress?: (pct: number) => void) =>
{
  await axiosInstance.put(upload_url, Hfile, {
    headers:{"Content-Type": Hfile.type},
    onUploadProgress: (evt) => {
      if(!evt.total) return;
      onProgress?.(Math.round((evt.loaded/evt.total)*100));
    },

    baseURL: "",
  });
}

export const completeHdf5Upload = async (upload_id: string, payload: {storage_key: string, etag?: string; sha256?: string})=>{
  const {data} = await axiosInstance.post(`api/py/hdf5/uploads/${upload_id}/complete`, payload);
  return data;
}

export const getHdf5UploadStatus = async (upload_id: string)=>{
  const {data} = await axiosInstance.get(`api/py/hdf5uploads/${upload_id}/status`);
  return data;
}

export const getHdf5UploadResult = async (upload_id: string)=>{
  const {data} = await axiosInstance.get(`api/py/hdf5/uploads/${upload_id}/result`);
  return data;
}


// export const uploadFile = async (
//   file: File,
//   onProgress?: (pct: number) => void
// ) => {
//   const formData = new FormData();
//   formData.append("file", file);

//   const response = await axiosInstance.post("/api/py/upload/", formData, {
//     headers: { "Content-Type": "multipart/form-data" },
//     onUploadProgress: (evt) => {
//       if (!evt.total) return;
//       const pct = Math.round((evt.loaded / evt.total) * 100);
//       onProgress?.(pct);
//     },
//   });

//   return response.data;
// };

// export const readHdf5 = async (file: File) => {
//   const formData = new FormData();
//   formData.append("file", file);

//   const response = await axiosInstance.post("/api/py/hdf5/read", formData, {
//     headers: { "Content-Type": "multipart/form-data" },
//   });

//   return response.data;
// };