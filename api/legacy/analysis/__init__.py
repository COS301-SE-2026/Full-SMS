"""Analysis algorithms: change point detection, clustering, lifetime fitting, correlation."""

from api.legacy.analysis.change_point import (
    CPAParams,
    ChangePointResult,
    ConfidenceLevel,
    find_change_points,
)
from api.legacy.analysis.correlation import (
    CorrelationResult,
    calculate_g2,
    rebin_correlation,
)
from api.legacy.analysis.histograms import (
    bin_photons,
    build_decay_histogram,
    compute_intensity_cps,
    rebin_histogram,
)
from api.legacy.analysis.lifetime import (
    FitMethod,
    FitSettings,
    StartpointMode,
    calculate_boundaries,
    colorshift,
    durbin_watson_bounds,
    estimate_background,
    estimate_irf_background,
    fit_decay,
    simulate_irf,
)

__all__ = [
    # Change point analysis
    "find_change_points",
    "ChangePointResult",
    "ConfidenceLevel",
    "CPAParams",
    # Correlation (g2)
    "calculate_g2",
    "CorrelationResult",
    "rebin_correlation",
    # Histograms
    "bin_photons",
    "build_decay_histogram",
    "compute_intensity_cps",
    "rebin_histogram",
    # Lifetime fitting
    "fit_decay",
    "FitMethod",
    "FitSettings",
    "StartpointMode",
    "calculate_boundaries",
    "colorshift",
    "durbin_watson_bounds",
    "estimate_background",
    "estimate_irf_background",
    "simulate_irf",
]
