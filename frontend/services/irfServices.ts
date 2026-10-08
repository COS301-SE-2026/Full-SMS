"use client"

import axiosInstance from "@/lib/api/axiosInstance";
import { uploadToSignedUrl } from "@/services/hdf5services";
import { GetMappedIRFReq, GetMappedIRFRes, MapIRFReq } from "@/types/analysis";

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
	const {data} = await axiosInstance.post(`/api/py/hdf5/irf/${payload.workspace_id}/map`, payload)
	return data
}

export const getIRFMappings = async (payload: any) =>{
const {data} = await axiosInstance.post(`/api/py/hdf5/irf/${payload.workspace_id}/mappings`, payload)
return data
}

export const deleteMapping = async (payload: MapIRFReq) => {
	const {data} = await axiosInstance.post(`/api/py/hdf5/irf/${payload.workspace_id}/map/delete`, payload)
	return data
}

export const getMappedIRF = async (payload: GetMappedIRFReq) =>{
	const {data} = await axiosInstance.post<GetMappedIRFRes>(`/api/py/hdf5/irf/${payload.workspace_id}/mapping`, payload)
	return data
}
