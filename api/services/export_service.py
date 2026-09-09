import gzip
import json
import tempfile
import os
import zipfile
import numpy as np
from pathlib import Path
from api.models.export_request import ExportRequest
from api.legacy.io import exporters
from api.services.analysis_services.cache_fallback import cache_fallback_service
from api.services.measurement_cache_service import get_cached_measurement
from api.utils.redis_Client import redisClient
from api.services.storage_service import build_storage_key, download_to_temp
from api.services.session_service import get_sessions
from api.legacy.models.level import LevelData
from api.legacy.io import plot_exporters
from api.legacy.models.group import GroupData, ClusteringResult, ClusteringStep
from api.legacy.models.fit import FitResult


def _get_measurement_data(upload_id:str, measurement_id: str, user_id: str) -> dict :
    cached_measurement = get_cached_measurement(upload_id, measurement_id)
    if not cached_measurement:
        cached_measurement = cache_fallback_service(upload_id, measurement_id)
    
    if not cached_measurement:
        raise ValueError(f"Measurement {measurement_id} not found for upload {upload_id}")

    if isinstance(cached_measurement, dict):
        return cached_measurement
    return {
        "id": cached_measurement.id,
        "name": cached_measurement.name,
        "channelWidth": cached_measurement.channelwidth,
        "description": cached_measurement.description,
        "channel1": {
            "abstimes": cached_measurement.channel1.abstimes,
            "microtimes": cached_measurement.channel1.microtimes,
        } if cached_measurement.channel1 else None,
        "channel2": {
            "abstimes": cached_measurement.channel2.abstimes,
            "microtimes": cached_measurement.channel2.microtimes,
        } if cached_measurement.channel2 else None,
    }

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
    fits = results.get("fits")

    if levels and levels.get("measurement_id") != measurement_id:
        raise NotImplementedError("Saved session does not match this measurement.")
    return {"levels": levels, "groups":groups, "fits": fits}




def _export_intensity_data(request, data, channel, measurement_name) -> tuple[Path, str] | None:
    if not request.export_intensity:
        return None
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
    return output_path, f"{measurement_name}_intensity{output_path.suffix}"



def _export_levels_data(request, analysis, measurement_name) -> tuple[Path, str] | None:
    if not (request.export_levels and analysis["levels"]):
        return None
    level_list = [LevelData(**lvl) for lvl in analysis["levels"]["levels"]]
    fd, temp_path = tempfile.mkstemp()
    os.close(fd)
    output_path=exporters.export_levels(
        levels = level_list,
        output_path=Path(temp_path),
        fmt=request.format,
        measurement_name=measurement_name,
    )
    return output_path, f"{measurement_name}_levels{output_path.suffix}"



def _export_groups_data(request, analysis, measurement_name) -> tuple[Path, str] | None:
    if not (request.export_groups and analysis["groups"]):
        return None
    selected_step =analysis["groups"]["selected_step_index"]
    groups_raw = analysis["groups"]["steps"][selected_step]["groups"]
    groups_list = [GroupData(**grp) for grp in groups_raw]
    fd, temp_path = tempfile.mkstemp()
    os.close(fd)
    output_path=exporters.export_groups(
        groups = groups_list,
        output_path=Path(temp_path),
        fmt=request.format,
        measurement_name=measurement_name,
    )
    return output_path, f"{measurement_name}_groups{output_path.suffix}"


def _export_fits_data(request, analysis, measurement_id, channel, measurement_name) -> tuple[Path, str] | None:
    if not (request.export_fits and analysis["fits"]):
        return None
    fit_data = analysis["fits"]
    fit_result = FitResult(
    tau=tuple(fit_data["tau"]),
    tau_std=tuple(fit_data["tau_std"]),
    amplitude=tuple(fit_data["amplitude"]),
    amplitude_std=tuple(fit_data["amplitude_std"]),
    shift=fit_data["shift"],
    shift_std=fit_data["shift_std"],
    chi_squared=fit_data["chi_squared"],
    durbin_watson=fit_data["durbin_watson"],
    dw_bounds=tuple(fit_data["dw_bounds"]) if fit_data.get("dw_bounds") else None,
    residuals=np.array(fit_data["residuals"], dtype=np.float64),
    fitted_curve=np.array(fit_data["fitted_curve"], dtype=np.float64),
    fit_start_index=fit_data["fit_start_index"],
    fit_end_index=fit_data["fit_end_index"],
    background=fit_data["background"],
    num_exponentials=fit_data["num_exponentials"],
    average_lifetime=fit_data["average_lifetime"],
    fitted_irf_fwhm=fit_data.get("fitted_irf_fwhm"),
    fitted_irf_fwhm_std=fit_data.get("fitted_irf_fwhm_std"),
    )

    fd, tmp_path = tempfile.mkstemp()
    os.close(fd)
    outpt_path= exporters.export_fit_results(
        fit_results={(int(measurement_id), channel, 0): fit_result},
        output_path=Path(tmp_path),
        fmt= request.format,
    )
    return outpt_path, f"{measurement_name}_fits{outpt_path.suffix}"

def _export_intensity_plot(request, data, channel, analysis_getter, measurement_name) -> tuple[Path, str] | None:
    if not request.plot_intensity:
        return None
    channel_key = f"channel{channel}"
    abstimes=np.array(data[channel_key]["abstimes"], dtype=np.uint64)

    plotlevels = None
    plot_groups = None
    if request.plotIntensity_levels or request.plotIntensity_groups:
        analysis = analysis_getter()
        if analysis["levels"]: 
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
    return output_path, f"{measurement_name}_intensity_plot{output_path.suffix}"



def _export_bic_plot(request, analysis_getter, data, measurement_name) -> tuple[Path, str] | None:
    if not request.plot_bic:
        return None
    analysis = analysis_getter()
    if not analysis["groups"]:
        return None
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
    return output_path, f"{measurement_name}_bic_plot{output_path.suffix}"


def _process_selection(request, selection, user_id) -> list[tuple[Path, str]]:
    measurement_id = selection.measurement_id
    channel = selection.channel
    data = _get_measurement_data(request.upload_id, measurement_id, user_id)
    measurement_name = data.get("name", f"measurement_{measurement_id}").replace(" ", "_")
    
    analysis_cache ={}
    def get_analysis():
        if "value" not in analysis_cache:
            analysis_cache["value"] = _get_saved_analysis(request.upload_id, measurement_id, user_id)
        return analysis_cache["value"]
    results = []

    intensity_result= _export_intensity_data(request, data, channel, measurement_name)
    if intensity_result:
        results.append(intensity_result)

    if request.export_levels or request.export_groups or request.export_fits:
        analysis = get_analysis()
        levels_result= _export_levels_data(request, analysis, measurement_name)
        if levels_result:
            results.append(levels_result)
        groups_result = _export_groups_data(request, analysis, measurement_name)
        if groups_result:
            results.append(groups_result)
        fits_result = _export_fits_data(request, analysis, measurement_id, channel, measurement_name )
        if fits_result:
            results.append(fits_result)

    plot_result = _export_intensity_plot(request, data, channel, get_analysis, measurement_name)
    if plot_result:
        results.append(plot_result)

    bic_result =_export_bic_plot(request, get_analysis, data, measurement_name)
    if bic_result:
            results.append(bic_result)
    return results
    

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
        output_paths.extend(_process_selection(request, selection, user_id))
    return _package_outputs(output_paths, request)    
            

                
       
        
def _package_outputs(output_paths, request) -> tuple[Path, str]:            
                
    if len(output_paths) == 1 :
        return output_paths[0]
         

    categories = []
    if request.export_intensity:
        categories.append("intensity")
    if request.export_levels:
        categories.append("levels")
    if request.export_groups:
        categories.append("groups")
    if request.export_fits:
        categories.append("fits")
    category_str = "-".join(categories) if categories else "export"

    measurement_ids_str = "-".join(sel.measurement_id for sel in request.selections)
        
    zip_filedescr,zip_path = tempfile.mkstemp(suffix=".zip")
    os.close(zip_filedescr)
    with zipfile.ZipFile(zip_path, "w") as zf:
        for path, normal_name in output_paths:
            zf.write(path,arcname=normal_name)

    normal_name_zip = f"export_{request.upload_id}_{measurement_ids_str}_{category_str}.zip"
    return Path(zip_path), normal_name_zip
