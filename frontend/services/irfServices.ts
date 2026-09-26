import axiosInstance from "@/lib/api/axiosInstance";
import { uploadToSignedUrl } from "@/services/hdf5services";
import { MapIRFReq } from "@/types/analysis";

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

	console.log(initData);


	await uploadToSignedUrl(initData.upload_url.signed_url, file, onProgress);

	const { data: completeData} = await axiosInstance.post(`/api/py/hdf5/irf/${initData.irf_id}/complete`);

	return completeData;
};

export const getWorkspaceIrfs = async (workspace_id: string) => {
	const { data } = await axiosInstance.get(`/api/py/hdf5/irf/${workspace_id.trim()}`);
	return data
}

export const createIRFMapping = async (payload: MapIRFReq) => {
	const {data} = await axiosInstance.post(`/api/py/hdf5/irf/${payload.workspace_id}`, payload)
	return data
}