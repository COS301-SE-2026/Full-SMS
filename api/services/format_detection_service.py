"""
File format detection service for Universal File Format Support.

Detects file formats based on magic bytes and file extensions.
Supports: HDF5 (custom & Photon-HDF5), PicoQuant, Becker & Hickl, CSV
"""

from pathlib import Path
from typing import Tuple, Dict, Any
from enum import Enum


class FileFormat(str, Enum):
    """Supported file formats for SMS data."""
    HDF5_CUSTOM = "hdf5_custom"          # Full SMS native format
    PHOTON_HDF5 = "photon_hdf5"          # Photon-HDF5 open standard
    PICOQUANT_PTU = "picoquant_ptu"      # PicoQuant unified format
    PICOQUANT_PT3 = "picoquant_pt3"      # PicoQuant T3 mode
    PICOQUANT_PT2 = "picoquant_pt2"      # PicoQuant T2 mode
    PICOQUANT_HT3 = "picoquant_ht3"      # HydraHarp T3
    PICOQUANT_T3R = "picoquant_t3r"      # TimeHarp T3
    BECKER_HICKL_SDT = "bh_sdt"          # Becker & Hickl SDT
    BECKER_HICKL_SPC = "bh_spc"          # Becker & Hickl SPC
    CSV = "csv"                           # CSV/text with column mapping
    UNKNOWN = "unknown"


# Magic bytes signatures for format detection
# Format: (magic_bytes, offset, format)
MAGIC_SIGNATURES = [
    (b"\x89HDF\r\n\x1a\n", 0, "hdf5"),           # HDF5 signature
    (b"PQTTTR", 0, FileFormat.PICOQUANT_PTU),    # PTU header (unified format)
    (b"PicoQuant", 0, FileFormat.PICOQUANT_PTU), # Alternative PTU header
]

# Extension to format mapping
EXTENSION_MAP = {
    ".h5": "hdf5",
    ".hdf5": "hdf5",
    ".hdf": "hdf5",
    ".ptu": FileFormat.PICOQUANT_PTU,
    ".pt3": FileFormat.PICOQUANT_PT3,
    ".pt2": FileFormat.PICOQUANT_PT2,
    ".ht3": FileFormat.PICOQUANT_HT3,
    ".t3r": FileFormat.PICOQUANT_T3R,
    ".sdt": FileFormat.BECKER_HICKL_SDT,
    ".spc": FileFormat.BECKER_HICKL_SPC,
    ".csv": FileFormat.CSV,
    ".txt": FileFormat.CSV,
    ".tsv": FileFormat.CSV,
}


def detect_format(file_path: str | Path) -> Tuple[FileFormat, Dict[str, Any]]:
    """
    Detect file format from magic bytes and extension.

    Args:
        file_path: Path to the file to detect

    Returns:
        Tuple of (FileFormat enum, metadata dict with detection details)
    """
    path = Path(file_path)
    extension = path.suffix.lower()
    metadata: Dict[str, Any] = {
        "extension": extension,
        "filename": path.name,
        "file_size": path.stat().st_size if path.exists() else 0,
    }

    if not path.exists():
        metadata["error"] = "File not found"
        return FileFormat.UNKNOWN, metadata

    # Read header bytes for magic detection
    try:
        with open(path, "rb") as f:
            header = f.read(64)
    except Exception as e:
        metadata["error"] = f"Could not read file: {e}"
        return FileFormat.UNKNOWN, metadata

    # Check magic bytes first (most reliable)
    for magic, offset, fmt in MAGIC_SIGNATURES:
        if header[offset:offset + len(magic)] == magic:
            if fmt == "hdf5":
                # Distinguish between custom HDF5 and Photon-HDF5
                detected = _detect_hdf5_subtype(path)
                metadata["detected_by"] = "magic_bytes"
                metadata["hdf5_subtype"] = detected.value
                return detected, metadata
            else:
                metadata["detected_by"] = "magic_bytes"
                return fmt, metadata

    # Fall back to extension-based detection
    fmt = EXTENSION_MAP.get(extension, FileFormat.UNKNOWN)

    if fmt == "hdf5":
        # Try to determine HDF5 subtype
        detected = _detect_hdf5_subtype(path)
        metadata["detected_by"] = "extension"
        metadata["hdf5_subtype"] = detected.value
        return detected, metadata

    metadata["detected_by"] = "extension" if fmt != FileFormat.UNKNOWN else "none"
    return fmt, metadata


def _detect_hdf5_subtype(path: Path) -> FileFormat:
    """
    Distinguish between custom HDF5 and Photon-HDF5 formats.

    Args:
        path: Path to HDF5 file

    Returns:
        FileFormat.HDF5_CUSTOM or FileFormat.PHOTON_HDF5
    """
    try:
        import h5py

        with h5py.File(path, "r") as f:
            # Photon-HDF5 has specific structure with photon_data group
            if "photon_data" in f:
                photon_data = f["photon_data"]
                if "timestamps" in photon_data or any(
                    key.startswith("timestamps") for key in photon_data.keys()
                ):
                    return FileFormat.PHOTON_HDF5

            # Full SMS custom format has "# Particles" attribute
            if "# Particles" in f.attrs:
                return FileFormat.HDF5_CUSTOM

            # Check for particle groups (Particle 1, Particle 2, etc.)
            particle_groups = [k for k in f.keys() if k.startswith("Particle")]
            if particle_groups:
                return FileFormat.HDF5_CUSTOM

    except ImportError:
        # h5py not available, assume custom based on extension
        pass
    except Exception:
        # Could not open as HDF5, might be corrupted or wrong format
        pass

    return FileFormat.UNKNOWN


def get_format_info(fmt: FileFormat) -> Dict[str, Any]:
    """
    Get human-readable information about a file format.

    Args:
        fmt: FileFormat enum value

    Returns:
        Dict with format name, description, and supported features
    """
    format_info = {
        FileFormat.HDF5_CUSTOM: {
            "name": "Full SMS HDF5",
            "description": "Native Full SMS format with particle measurements",
            "extensions": [".h5", ".hdf5"],
            "supports_dual_channel": True,
            "supports_spectra": True,
            "supports_raster": True,
        },
        FileFormat.PHOTON_HDF5: {
            "name": "Photon-HDF5",
            "description": "Open standard for single-molecule data (photon-hdf5.org)",
            "extensions": [".h5", ".hdf5"],
            "supports_dual_channel": True,
            "supports_spectra": False,
            "supports_raster": False,
        },
        FileFormat.PICOQUANT_PTU: {
            "name": "PicoQuant PTU",
            "description": "PicoQuant unified TTTR format",
            "extensions": [".ptu"],
            "supports_dual_channel": True,
            "supports_spectra": False,
            "supports_raster": False,
        },
        FileFormat.PICOQUANT_PT3: {
            "name": "PicoQuant PT3",
            "description": "PicoQuant PicoHarp T3 mode",
            "extensions": [".pt3"],
            "supports_dual_channel": True,
            "supports_spectra": False,
            "supports_raster": False,
        },
        FileFormat.PICOQUANT_PT2: {
            "name": "PicoQuant PT2",
            "description": "PicoQuant PicoHarp T2 mode",
            "extensions": [".pt2"],
            "supports_dual_channel": True,
            "supports_spectra": False,
            "supports_raster": False,
        },
        FileFormat.PICOQUANT_HT3: {
            "name": "PicoQuant HT3",
            "description": "PicoQuant HydraHarp T3 mode",
            "extensions": [".ht3"],
            "supports_dual_channel": True,
            "supports_spectra": False,
            "supports_raster": False,
        },
        FileFormat.PICOQUANT_T3R: {
            "name": "PicoQuant T3R",
            "description": "PicoQuant TimeHarp T3 mode",
            "extensions": [".t3r"],
            "supports_dual_channel": True,
            "supports_spectra": False,
            "supports_raster": False,
        },
        FileFormat.BECKER_HICKL_SDT: {
            "name": "Becker & Hickl SDT",
            "description": "Becker & Hickl setup and data file",
            "extensions": [".sdt"],
            "supports_dual_channel": True,
            "supports_spectra": False,
            "supports_raster": True,
        },
        FileFormat.BECKER_HICKL_SPC: {
            "name": "Becker & Hickl SPC",
            "description": "Becker & Hickl SPC data file",
            "extensions": [".spc"],
            "supports_dual_channel": True,
            "supports_spectra": False,
            "supports_raster": False,
        },
        FileFormat.CSV: {
            "name": "CSV/Text",
            "description": "Delimited text file with photon data",
            "extensions": [".csv", ".txt", ".tsv"],
            "supports_dual_channel": False,
            "supports_spectra": False,
            "supports_raster": False,
        },
        FileFormat.UNKNOWN: {
            "name": "Unknown",
            "description": "Unrecognized file format",
            "extensions": [],
            "supports_dual_channel": False,
            "supports_spectra": False,
            "supports_raster": False,
        },
    }

    return format_info.get(fmt, format_info[FileFormat.UNKNOWN])


def get_all_supported_extensions() -> list[str]:
    """Get list of all supported file extensions."""
    return list(EXTENSION_MAP.keys())


def is_format_supported(file_path: str | Path) -> bool:
    """Check if a file format is supported."""
    fmt, _ = detect_format(file_path)
    return fmt != FileFormat.UNKNOWN
