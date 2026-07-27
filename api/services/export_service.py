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
    cached_data = redisClient.get(f"raw_data:{upload_id}:{measurement_id}")
    if cached_data:
        return json.loads(cached_data)
    
    storage_key = build_storage_key(user_id, upload_id, "measurements.json.gz")
    temporary_path = download_to_temp(storage_key, file_extension=".json.gz")
    with gzip.open(temporary_path, "rt", encoding="utf-8") as f:
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
           num_original_levels=groups["num_original_levels"],
    )


def export_data(request: ExportRequest, user_id: str) -> tuple[Path, str]:
    output_paths =[]
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
            normal_name = f"{measurement_name}_intensity{output_path.suffix}"
            
        

            output_paths.append((output_path, normal_name))
        if request.export_levels or request.export_groups:
            analysis = _get_saved_analysis(request.upload_id, measurement_id, user_id)

            if request.export_levels and analysis["levels"]:
                level_list = [LevelData(**lvl) for lvl in analysis["levels"]["levels"]]
                fd, temp_path = tempfile.mkstemp()
                os.close(fd)
                output_path=exporters.export_levels(
                    levels = level_list,
                    output_path=Path(temp_path),
                    fmt=request.format,
                    measurement_name=data.get("name", ""),
                )
                output_paths.append((output_path, f"{measurement_name}_levels{output_path.suffix}"))

            if request.export_groups and analysis["groups"]:
                selected_step =analysis["groups"]["selected_step_index"]
                groups_raw = analysis["groups"]["steps"][selected_step]["groups"]
                groups_list = [GroupData(**grp) for grp in groups_raw]
                fd, temp_path = tempfile.mkstemp()
                os.close(fd)
                output_path=exporters.export_groups(
                    groups = groups_list,
                    output_path=Path(temp_path),
                    fmt=request.format,
                    measurement_name=data.get("name", ""),
                )
                output_paths.append((output_path, f"{measurement_name}_groups{output_path.suffix}"))

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
            output_paths.append((output_path, f"{measurement_name}_intensity_plot{output_path.suffix}"))


        if request.plot_bic:
            analysis = _get_saved_analysis(request.upload_id, measurement_id, user_id)
            if analysis["groups"]:
                result = clustering_result(analysis)

                fd, temp_path = tempfile.mkstemp()
                os.close(fd)
                output_path=plot_exporters.export_bic_plot(
                    clustering_result = result,
                    output_path=Path(temp_path),
                    fmt=request.plot_format,
                    dpi = request.plot_dpi,
                    title=data.get("name", ""),
                )
                output_paths.append((output_path, f"{measurement_name}_bic_plot{output_path.suffix}"))
            
                
    if len(output_paths) == 1 :
        path, normal_name = output_paths[0]
        return path, normal_name

    categories = []
    if request.export_intensity:
        categories.append("intensity")
    if request.export_levels:
        categories.append("levels")
    if request.export_groups:
        categories.append("groups")
    category_str = "-".join(categories) if categories else "export"

    measurement_ids_str = "-".join(sel.measurement_id for sel in request.selections)
        
    zip_filedescr,zip_path = tempfile.mkstemp(suffix=".zip")
    os.close(zip_filedescr)
    with zipfile.ZipFile(zip_path, "w") as zf:
        for path, normal_name in output_paths:
            zf.write(path,arcname=normal_name)

    normal_name_zip = f"export_{request.upload_id}_{measurement_ids_str}_{category_str}.zip"
    return Path(zip_path), normal_name_zip
