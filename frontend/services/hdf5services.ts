import axiosInstance from "@/lib/api/axiosInstance";
import { InitUploadResponse } from "@/types/hdf5";




export const computeSHA256 = async(hdf5_file: File): Promise<string>=>{
  const array = await hdf5_file.arrayBuffer();
  const checksumBuffer = await window.crypto.subtle.digest("SHA-256", array);

  const checksumArray = Array.from(new Uint8Array(checksumBuffer));
  const checksumHex = checksumArray.map((b) => b.toString(16).padStart(2, "0")).join("");

  return checksumHex;
}

export const initHdf5Upload = async (payload:{
  filename: string;
  size_bytes: number;
  content_type: string;
  sha256: string;
})=>{
  const {data} = await axiosInstance.post<InitUploadResponse>("/api/py/hdf5/uploads/init", payload);
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

export const completeHdf5Upload = async (upload_id: string)=>{
  const {data} = await axiosInstance.post(`/api/py/hdf5/uploads/${upload_id}/complete`);
  return data;
}

export const getHdf5UploadStatus = async (upload_id: string)=>{
  const {data} = await axiosInstance.get(`/api/py/hdf5/uploads/${upload_id}`);
  return data;
}

export const getHdf5UploadResult = async (upload_id: string)=>{
  const {data} = await axiosInstance.get(`/api/py/hdf5/uploads/${upload_id}/result`);
  return data;
}

export const getUserHdf5Uploads = async () =>{
  const {data}  = await axiosInstance.get(`api/py/hdf5/user-uploads`);
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