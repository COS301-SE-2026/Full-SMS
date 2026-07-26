import gzip
import json
import tempfile
import os
import zipfile
import numpy as np
from pathlib import Path
from api.models.export_request import ExportRequest
from api.legacy.io import exporters
from api.utils.redis_Client import redisClient
from api.services.storage_service import build_storage_key, download_to_temp
from api.services.session_service import get_sessions
from api.legacy.models.level import LevelData
from api.legacy.io import plot_exporters
from api.legacy.models.group import GroupData, ClusteringResult, ClusteringStep

def _get_measurement_data(upload_id:str, measurement_id: str, user_id: str) -> dict :
    cashedData = redisClient.get(f"raw_data:{upload_id}:{measurement_id}")
    if cashedData:
        return json.loads(cashedData)
    
    storage_key = build_storage_key(user_id, upload_id, "measurements.json.gz")
    temporaryPath = download_to_temp(storage_key, file_extension=".json.gz")
    with gzip.open(temporaryPath, "rt", encoding="utf-8") as f:
        measurements = json.load(f)
        for measurement in measurements:
            if measurement.get("id") == measurement_id:
                return measurement
        raise ValueError(f"measurement {measurement_id} not found in backup")


def _get_saved_analysis(upload_id: str, measurement_id:str, user_id:str) -> dict:
    sessions = get_sessions(user_id)
    match = [ s for s in sessions if s.get("dataset_ref") == upload_id]
    if not match:
        raise NotImplementedError("NO saved session for this upload. Run and save analysis first.")

    match.sort(key=lambda s: s.get("created_at", ""), reverse=True)
    latest = match[0]
    results = latest.get("results", {})
    levels = results.get("levels")
    groups = results.get("groups")

    if levels and levels.get("measurement_id") != measurement_id:
        raise NotImplementedError("Saved session does not match this measurement.")
    return {"levels": levels, "groups":groups}

def clustering_result(analysis: dict) -> ClusteringResult:
    groups = analysis["groups"]
    steps = tuple(
        ClusteringStep(
            groups=[GroupData(**g) for g in step["groups"]],
            level_group_assignments=step["level_group_assignments"],
            bic=step["bic"],
            num_groups=step["num_groups"],
        )
        for step in groups["steps"]
    )
    return ClusteringResult(
           steps=steps,
           optimal_step_index=groups["optimal_step_index"],
           selected_step_index=groups["selected_step_index"],
    )


def export_data(request: ExportRequest, user_id: str) -> tuple[Path, str]:
    outputPaths =[]
    for selection in request.selections:
        measurement_id = selection.measurement_id
        channel = selection.channel
        data = _get_measurement_data(request.upload_id, measurement_id, user_id)
        measurement_name = data.get("name", f"measurement_{measurement_id}").replace(" ", "_")
        
        if request.export_intensity:
            channel_key = f"channel{channel}"
            abstimes=np.array(data[channel_key]["abstimes"], dtype=np.uint64)

            fd, temp_path = tempfile.mkstemp()
            os.close(fd)
            output_path=exporters.export_intensity_trace(
                abstimes=abstimes,
                output_path=Path(temp_path),
                fmt=request.format,
                bin_size_ms = request.bin_size_ms,
                measurement_name=data.get("name", ""),
            
            )
            normalName = f"{measurement_name}_intensity{output_path.suffix}"
            
        

            outputPaths.append((output_path, normalName))
        if request.export_levels or request.export_groups:
            analysis = _get_saved_analysis(request.upload_id, measurement_id, user_id)

            if request.export_levels and analysis["levels"]:
                levelsList = [LevelData(**lvl) for lvl in analysis["levels"]["levels"]]
                fd, temp_path = tempfile.mkstemp()
                os.close(fd)
                output_path=exporters.export_levels(
                    levels = levelsList,
                    output_path=Path(temp_path),
                    fmt=request.format,
                    measurement_name=data.get("name", ""),
                )
                outputPaths.append((output_path, f"{measurement_name}_levels{output_path.suffix}"))

            if request.export_groups and analysis["groups"]:
                selected_step =analysis["groups"]["selected_step_index"]
                groups_raw = analysis["groups"]["steps"][selected_step]["groups"]
                groupsList = [GroupData(**grp) for grp in groups_raw]
                fd, temp_path = tempfile.mkstemp()
                os.close(fd)
                output_path=exporters.export_groups(
                    groups = groupsList,
                    output_path=Path(temp_path),
                    fmt=request.format,
                    measurement_name=data.get("name", ""),
                )
                outputPaths.append((output_path, f"{measurement_name}_groups{output_path.suffix}"))

        if request.plot_intensity:
            channel_key = f"channel{channel}"
            abstimes=np.array(data[channel_key]["abstimes"], dtype=np.uint64)

            plotlevels = None
            plot_groups = None
            if request.plotIntensity_levels or request.plotIntensity_groups:
                analysis = _get_saved_analysis(request.upload_id, measurement_id, user_id)
                if analysis["levels"] and (request.plotIntensity_levels or request.plotIntensity_groups ):
                    plotlevels = [LevelData(**lvl) for lvl in analysis["levels"]["levels"]]
                if request.plotIntensity_groups and analysis["groups"]:
                    selected_step = analysis["groups"]["selected_step_index"]
                    groups_raw = analysis["groups"]["steps"][selected_step]["groups"]
                    plot_groups= [GroupData(**grp) for grp in groups_raw]    
        
            fd, temp_path = tempfile.mkstemp()
            os.close(fd)
            output_path=plot_exporters.export_intensity_plot(
                abstimes=abstimes,
                output_path=Path(temp_path),
                fmt=request.plot_format,
                dpi=request.plot_dpi,
                bin_size_ms = request.bin_size_ms,
                title=data.get("name", ""),
                levels=plotlevels,
                groups=plot_groups,
                show_levels=request.plotIntensity_levels,
                show_groups=bool(plot_groups),
            )
            outputPaths.append((output_path, f"{measurement_name}_intensity_plot{output_path.suffix}"))
                
    if len(outputPaths) == 1 :
        path, normalName = outputPaths[0]
        return path, normalName

    categories = []
    if request.export_intensity:
        categories.append("intensity")
    if request.export_levels:
        categories.append("levels")
    if request.export_groups:
        categories.append("groups")
    categoryStr = "-".join(categories) if categories else "export"

    measurementIds_str = "-".join(sel.measurement_id for sel in request.selections)
        
    zip_filedescr,zip_path = tempfile.mkstemp(suffix=".zip")
    os.close(zip_filedescr)
    with zipfile.ZipFile(zip_path, "w") as zf:
        for path, normalName in outputPaths:
            zf.write(path,arcname=normalName)

    normalName_zip = f"export_{request.upload_id}_{measurementIds_str}_{categoryStr}.zip"
    return Path(zip_path), normalName_zip
