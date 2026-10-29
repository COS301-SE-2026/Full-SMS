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
from api.legacy.analysis.histograms import build_decay_histogram


class MissingAnalysisDataError(NotImplementedError):
    def __init__(self, category: str, measurement_name: str):
        self.category = category
        self.measurement_name = measurement_name
        super().__init__(
            f"No saved analysis data found for {measurement_name}. "
            f"Run and save analysis before exporting."
        )

class InvalidExportDataErr(ValueError):
    def __init__(self, message: str):
        super().__init__(message)

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

def _get_saved_analysis(upload_id: str, measurement_id:str, user_id:str, channel: int = 1) -> dict:
    sessions = get_sessions(user_id)
    match = [ s for s in sessions if s.get("dataset_ref") == upload_id]
    if not match:
        raise MissingAnalysisDataError("session", f"upload {upload_id}")

    match.sort(key=lambda s: s.get("created_at", ""), reverse=True)
    latest = match[0]
    results = latest.get("results") or {}
    current_levels = results.get("levels")
    is_current_measurement = (
        not current_levels or current_levels.get("measurement_id") == measurement_id
    )

    # Levels for any measurement are kept in cpaResults (keyed "<measurement>:<channel>"
    # for multi-channel files); groups are only saved for the current measurement.
    cpa_results = results.get("cpaResults") or {}
    levels = (
        cpa_results.get(f"{measurement_id}:{channel}")
        or cpa_results.get(measurement_id)
        or (current_levels if is_current_measurement else None)
    )
    if not levels and not is_current_measurement and not results.get("fitResultsByTarget"):
        raise MissingAnalysisDataError("analysis", f"measurement {measurement_id}")

    # Grouping results use the same keys as cpaResults; older sessions only saved "groups"
    # for the measurement that was open.
    grouping_results = results.get("groupingResults") or {}
    groups = (
        grouping_results.get(f"{measurement_id}:{channel}")
        or grouping_results.get(measurement_id)
        or (results.get("groups") if is_current_measurement else None)
    )

    return {
        "levels": levels,
        "groups": groups,
        "fits": results.get("fits"),
        "fit_results_by_target": results.get("fitResultsByTarget") or {},
        "current_fit_key": results.get("currentFitKey"),
    }




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



def _export_levels_data(request, analysis, measurement_name, measurement_id=None, channel=1) -> tuple[Path, str] | None:
    if not request.export_levels:
        return None

    if not analysis["levels"]:
        raise MissingAnalysisDataError("levels", measurement_name)

    level_list = [LevelData(**lvl) for lvl in analysis["levels"]["levels"]]
    level_fits = None
    if measurement_id is not None:
        level_fits = {
            target_id: _fit_result_from_dict(fit_data)
            for target_id, fit_data in _collect_fit_dicts(analysis, measurement_id, channel).items()
            if target_id != MEASUREMENT_FIT_ID
        } or None
    fd, temp_path = tempfile.mkstemp()
    os.close(fd)
    output_path=exporters.export_levels(
        levels = level_list,
        output_path=Path(temp_path),
        fmt=request.format,
        measurement_name=measurement_name,
        level_fits=level_fits,
    )
    return output_path, f"{measurement_name}_levels{output_path.suffix}"



def _export_groups_data(request, analysis, measurement_name, measurement_id=None, channel=1) -> tuple[Path, str] | None:
    if not request.export_groups:
        return None

    if not analysis["groups"]:
        raise MissingAnalysisDataError("groups", measurement_name)

    selected_step =analysis["groups"]["selected_step_index"]
    groups_raw = analysis["groups"]["steps"][selected_step]["groups"]
    groups_list = [GroupData(**grp) for grp in groups_raw]
    group_fits = None
    if measurement_id is not None:
        group_fits = {
            group_id: _fit_result_from_dict(fit_data)
            for group_id, fit_data in _collect_group_fit_dicts(analysis, measurement_id, channel).items()
        } or None
    fd, temp_path = tempfile.mkstemp()
    os.close(fd)
    output_path=exporters.export_groups(
        groups = groups_list,
        output_path=Path(temp_path),
        fmt=request.format,
        measurement_name=measurement_name,
        group_fits=group_fits,
    )
    return output_path, f"{measurement_name}_groups{output_path.suffix}"


MEASUREMENT_FIT_ID = -1  # level_or_group_id used for whole-measurement fits (legacy convention)


def _float_array(values) -> np.ndarray:
    return np.array(
        [np.nan if v is None else v for v in (values or [])], dtype=np.float64
    )


def _fit_result_from_dict(fit_data: dict) -> FitResult:
    return FitResult(
        tau=tuple(fit_data["tau"]),
        tau_std=tuple(fit_data["tau_std"]),
        amplitude=tuple(fit_data["amplitude"]),
        amplitude_std=tuple(fit_data["amplitude_std"]),
        shift=fit_data["shift"],
        shift_std=fit_data["shift_std"],
        chi_squared=fit_data["chi_squared"],
        durbin_watson=fit_data["durbin_watson"],
        dw_bounds=tuple(fit_data["dw_bounds"]) if fit_data.get("dw_bounds") else None,
        residuals=_float_array(fit_data.get("residuals")),
        fitted_curve=_float_array(fit_data.get("fitted_curve")),
        fit_start_index=fit_data["fit_start_index"],
        fit_end_index=fit_data["fit_end_index"],
        background=fit_data["background"],
        num_exponentials=fit_data["num_exponentials"],
        average_lifetime=fit_data["average_lifetime"],
        fitted_irf_fwhm=fit_data.get("fitted_irf_fwhm"),
        fitted_irf_fwhm_std=fit_data.get("fitted_irf_fwhm_std"),
    )


GROUP_KEY_PREFIX = "group["


def _group_fit_key(group: dict, levels: list[dict]) -> str | None:
    """Saved-fit key part for a group: its levels' photon ranges, sorted by start.

    Must match groupFitKeyPart in frontend/lib/lifetimeTargets.ts. Keying on the photon
    ranges (not the group id or grouping step) means a fit stays attached to exactly the
    photons it was made from, even if grouping is re-run.
    """
    indices = group.get("level_indices") or []
    if not indices or any(not 0 <= i < len(levels) for i in indices):
        return None
    ranges = sorted((levels[i]["start_index"], levels[i]["end_index"]) for i in indices)
    return GROUP_KEY_PREFIX + ",".join(f"{start}-{end}" for start, end in ranges) + "]"


def _selected_groups(analysis) -> list[dict]:
    groups = analysis.get("groups") or {}
    steps = groups.get("steps") or []
    selected = groups.get("selected_step_index")
    if selected is None or not 0 <= selected < len(steps):
        return []
    return steps[selected].get("groups") or []


def _fit_target_id(level_key: str, levels: list[dict]) -> int | None:
    """Map a saved fit key's level part ("full" or "<start>-<end>") to an export id."""
    if level_key == "full":
        return MEASUREMENT_FIT_ID
    if level_key.startswith(GROUP_KEY_PREFIX):
        return None
    start, _, end = level_key.partition("-")
    for index, level in enumerate(levels):
        if str(level.get("start_index")) == start and str(level.get("end_index")) == end:
            return index
    return None


def _collect_fit_dicts(analysis, measurement_id, channel) -> dict[int, dict]:
    """Return saved fits for one measurement/channel, keyed by export id.

    Fits are saved per target as "<upload>:<measurement>:<channel>:<full|start-end>".
    Sessions saved before per-target fits only hold the displayed fit in "fits".
    """
    levels = (analysis.get("levels") or {}).get("levels") or []
    fits_by_target = analysis.get("fit_results_by_target") or {}
    if not fits_by_target and analysis.get("fits"):
        fits_by_target = {
            analysis.get("current_fit_key") or f"::{measurement_id}:{channel}:full": analysis["fits"]
        }

    collected: dict[int, dict] = {}
    for level_key, fit_data in _fits_for_selection(fits_by_target, measurement_id, channel):
        target_id = _fit_target_id(level_key, levels)
        if target_id is not None:
            collected[target_id] = fit_data
    return collected


def _fits_for_selection(fits_by_target: dict, measurement_id, channel):
    """Yield (level key part, fit) for saved fits of one measurement/channel."""
    for key, fit_data in fits_by_target.items():
        parts = key.rsplit(":", 3)
        if len(parts) != 4 or not fit_data:
            continue
        _, fit_measurement, fit_channel, level_key = parts
        if fit_measurement == str(measurement_id) and fit_channel == str(channel):
            yield level_key, fit_data


def _collect_group_fit_dicts(analysis, measurement_id, channel) -> dict[int, dict]:
    """Return saved group fits for one measurement/channel, keyed by group_id of the
    selected grouping step. Fits for groups no longer in that step are left out."""
    levels = (analysis.get("levels") or {}).get("levels") or []
    group_ids_by_key = {}
    for group in _selected_groups(analysis):
        key = _group_fit_key(group, levels)
        if key is not None:
            group_ids_by_key[key] = group["group_id"]

    fits_by_target = analysis.get("fit_results_by_target") or {}
    return {
        group_ids_by_key[level_key]: fit_data
        for level_key, fit_data in _fits_for_selection(fits_by_target, measurement_id, channel)
        if level_key in group_ids_by_key
    }


def _export_fits_data(request, analysis, measurement_id, channel, measurement_name) -> tuple[Path, str] | None:
    if not request.export_fits:
        return None

    fit_dicts = _collect_fit_dicts(analysis, measurement_id, channel)
    if not fit_dicts:
        # Only group fits were saved: those are written by _export_group_fits_data
        if _collect_group_fit_dicts(analysis, measurement_id, channel):
            return None
        raise MissingAnalysisDataError("lifetime fit", measurement_name)

    fit_results = {
        (int(measurement_id), channel, target_id): _fit_result_from_dict(fit_data)
        for target_id, fit_data in sorted(fit_dicts.items())
    }

    fd, tmp_path = tempfile.mkstemp()
    os.close(fd)
    outpt_path= exporters.export_fit_results(
        fit_results=fit_results,
        output_path=Path(tmp_path),
        fmt= request.format,
    )
    return outpt_path, f"{measurement_name}_fits{outpt_path.suffix}"


def _export_group_fits_data(request, analysis, measurement_id, channel, measurement_name) -> tuple[Path, str] | None:
    """Group fits go in their own file: level_or_group_id would otherwise mix level
    indices and group ids in one column."""
    if not request.export_fits:
        return None

    group_fit_dicts = _collect_group_fit_dicts(analysis, measurement_id, channel)
    if not group_fit_dicts:
        return None

    fd, tmp_path = tempfile.mkstemp()
    os.close(fd)
    output_path = exporters.export_fit_results(
        fit_results={
            (int(measurement_id), channel, group_id): _fit_result_from_dict(fit_data)
            for group_id, fit_data in sorted(group_fit_dicts.items())
        },
        output_path=Path(tmp_path),
        fmt=request.format,
    )
    return output_path, f"{measurement_name}_group_fits{output_path.suffix}"

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



def _decay_plot_fit(fit_data: dict) -> FitResult:
    """Saved fits hold full-range curves; the decay plot expects fit-window arrays."""
    start, end = fit_data["fit_start_index"], fit_data["fit_end_index"]
    return _fit_result_from_dict({
        **fit_data,
        "fitted_curve": (fit_data.get("fitted_curve") or [])[start:end],
        "residuals": (fit_data.get("residuals") or [])[start:end],
    })


def _export_decay_plot(request, data, channel, analysis_getter, measurement_id, measurement_name) -> tuple[Path, str] | None:
    if not request.plot_decay:
        return None

    fit_data = None
    if request.plotDecay_fit or request.plotDecay_irf:
        fit_data = _collect_fit_dicts(analysis_getter(), measurement_id, channel).get(MEASUREMENT_FIT_ID)

    if fit_data and fit_data.get("times") and fit_data.get("counts"):
        t_ns = np.array(fit_data["times"], dtype=np.float64)
        counts = np.array(fit_data["counts"], dtype=np.int64)
    else:
        channel_data = data.get(f"channel{channel}") or {}
        channelwidth = data.get("channelwidth") or data.get("channelWidth") or 0.0
        microtimes = np.asarray(channel_data.get("microtimes") or [], dtype=np.float64)
        if channelwidth <= 0 or len(microtimes) == 0:
            raise InvalidExportDataErr(f"No decay data available for {measurement_name}.")
        t_ns, counts = build_decay_histogram(microtimes=microtimes, channelwidth=channelwidth)

    irf_t = irf_counts = None
    if request.plotDecay_irf and fit_data and fit_data.get("irf"):
        irf_counts = _float_array(fit_data["irf"])[: len(t_ns)]
        irf_t = t_ns[: len(irf_counts)] + fit_data["shift"]

    fd, temp_path = tempfile.mkstemp()
    os.close(fd)
    output_path = plot_exporters.export_decay_plot(
        t_ns=t_ns,
        counts=counts,
        output_path=Path(temp_path),
        channelwidth=float(t_ns[1] - t_ns[0]) if len(t_ns) > 1 else 0.1,
        fit_result=_decay_plot_fit(fit_data) if request.plotDecay_fit and fit_data else None,
        irf_t=irf_t,
        irf_counts=irf_counts,
        show_irf=irf_counts is not None,
        fmt=request.plot_format,
        dpi=request.plot_dpi,
        title=data.get("name", ""),
    )
    return output_path, f"{measurement_name}_decay_plot{output_path.suffix}"


def _export_bic_plot(request, analysis_getter, data, measurement_name) -> tuple[Path, str] | None:
    if not request.plot_bic:
        return None
    analysis = analysis_getter()
    if not analysis["groups"]:
        raise MissingAnalysisDataError("BIC plot", measurement_name)
            
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


def _export_correlation_plot(request, data, measurement_name) -> tuple[Path, str] | None:
    if not request.plot_correlation:
        return None
    if not request.correlation_tau or not request.correlation_g2:
        raise InvalidExportDataErr("This measurement has only one TCSPC channel. Correlation analysis requires dual-channel data.")

    fd, temp_path=tempfile.mkstemp()
    os.close(fd)
    output_path = plot_exporters.export_correlation_plot(
        tau=request.correlation_tau,
        g2=request.correlation_g2,
        output_path=Path(temp_path),
        fmt=request.plot_format,
        dpi=request.plot_dpi,
        title=data.get("name", ""),
    )
    return output_path, f"{measurement_name}_correlation_plot{output_path.suffix}"

def _process_selection(request, selection, user_id) -> list[tuple[Path, str]]:
    measurement_id = selection.measurement_id
    channel = selection.channel
    data = _get_measurement_data(request.upload_id, measurement_id, user_id)
    measurement_name = data.get("name", f"measurement_{measurement_id}").replace(" ", "_")
    
    analysis_cache ={}
    def get_analysis():
        if "value" not in analysis_cache:
            analysis_cache["value"] = _get_saved_analysis(request.upload_id, measurement_id, user_id, channel)
        return analysis_cache["value"]
    results = []

    intensity_result= _export_intensity_data(request, data, channel, measurement_name)
    if intensity_result:
        results.append(intensity_result)

    if request.export_levels or request.export_groups or request.export_fits:
        analysis = get_analysis()
        levels_result= _export_levels_data(request, analysis, measurement_name, measurement_id, channel)
        if levels_result:
            results.append(levels_result)
        groups_result = _export_groups_data(request, analysis, measurement_name, measurement_id, channel)
        if groups_result:
            results.append(groups_result)
        fits_result = _export_fits_data(request, analysis, measurement_id, channel, measurement_name )
        if fits_result:
            results.append(fits_result)
        group_fits_result = _export_group_fits_data(request, analysis, measurement_id, channel, measurement_name)
        if group_fits_result:
            results.append(group_fits_result)

    plot_result = _export_intensity_plot(request, data, channel, get_analysis, measurement_name)
    if plot_result:
        results.append(plot_result)

    decay_result = _export_decay_plot(request, data, channel, get_analysis, measurement_id, measurement_name)
    if decay_result:
        results.append(decay_result)

    bic_result =_export_bic_plot(request, get_analysis, data, measurement_name)
    if bic_result:
            results.append(bic_result)

    correlation_result = _export_correlation_plot(request, data, measurement_name)
    if correlation_result:
        results.append(correlation_result)
    
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
