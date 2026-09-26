import axiosInstance from "@/lib/api/axiosInstance";
import { uploadToSignedUrl } from "@/services/hdf5services";

export const uploadIrfFile = async (
  file: File,
  workspaceId: string,
  customName: string,
  onProgress?: (pct: number) => void
) => {

    const { data: initData } = await axiosInstance.post("/api/py/hdf5/irf/init", {
    filename: file.name,
    workspace_id: workspaceId,
    name: customName,
    size_bytes: file.size,
  });

  await uploadToSignedUrl(initData.upload_url, file, onProgress);

  const { data: completeData } = await axiosInstance.post(
    `/api/py/hdf5/irf/${initData.irf_id}/complete`
  );

  return completeData;
};

export const getWorkspaceIrfs = async (workspace_id: string)=>{
  const {data} = await axiosInstance.get(`/api/py/hdf5/irf/${workspace_id}` );
  return data
}