"""
Reader factory for Universal File Format Support.

Provides unified interface to read any supported file format.
Auto-detects format and delegates to appropriate reader.
"""

from pathlib import Path
from typing import Optional, List, Dict, Any

from .base import FileReader, ReaderResult
from .picoquant_reader import PicoQuantReader
from .bh_reader import BeckerHicklReader
from .photon_hdf5_reader import PhotonHDF5Reader
from .csv_reader import CSVReader
from api.services.format_detection_service import detect_format, FileFormat
from .phu_reader import PicoQuantPhuReader

# Registry of all available readers
_READERS: List[FileReader] = [
    PicoQuantReader(),
    BeckerHicklReader(),
    PhotonHDF5Reader(),
    CSVReader(),
    PicoQuantPhuReader()
]


def get_reader(
    path: str | Path,
    format_hint: Optional[FileFormat] = None,
) -> Optional[FileReader]:
    """
    Get appropriate reader for a file.

    Args:
        path: File path to read
        format_hint: Optional format hint from detection (speeds up lookup)

    Returns:
        FileReader instance or None if no reader found
    """
    path = Path(path)

    # Use format hint if provided
    if format_hint is not None:
        reader = _get_reader_for_format(format_hint)
        if reader:
            return reader

    # Try each reader
    for reader in _READERS:
        if reader.can_read(path):
            return reader

    return None


def _get_reader_for_format(fmt: FileFormat) -> Optional[FileReader]:
    """Get reader for a specific format."""
    format_to_reader = {
        FileFormat.PICOQUANT_PTU: PicoQuantReader,
        FileFormat.BECKER_HICKL_SDT: BeckerHicklReader,
        FileFormat.BECKER_HICKL_SPC: BeckerHicklReader,
        FileFormat.PHOTON_HDF5: PhotonHDF5Reader,
        FileFormat.CSV: CSVReader,
        FileFormat.PICOQUANT_PHU: PicoQuantPhuReader
    }

    reader_class = format_to_reader.get(fmt)
    if reader_class:
        return reader_class()

    return None


def read_file(
    path: str | Path,
    format_hint: Optional[FileFormat] = None,
    options: Optional[Dict[str, Any]] = None,
) -> ReaderResult:
    """
    Auto-detect format and read file.

    This is the main entry point for reading any supported file.

    Args:
        path: File path to read
        format_hint: Optional format hint (skips detection if provided)
        options: Optional reader-specific options (e.g., column mapping for CSV)

    Returns:
        ReaderResult with measurements or error
    """
    path = Path(path)

    # Check file exists
    if not path.exists():
        return ReaderResult(
            measurements=[],
            file_metadata={"path": str(path)},
            format_name="Unknown",
            success=False,
            error=f"File not found: {path}",
        )

    # Detect format if not provided
    if format_hint is None:
        detected_format, metadata = detect_format(path)
    else:
        detected_format = format_hint
        metadata = {"format_hint": format_hint.value}

    # Handle custom HDF5 format (use legacy reader)
    if detected_format == FileFormat.HDF5_CUSTOM:
        return _read_custom_hdf5(path, metadata)

    # Get reader for detected format
    reader = get_reader(path, detected_format)

    if reader is None:
        return ReaderResult(
            measurements=[],
            file_metadata=metadata,
            format_name=detected_format.value,
            success=False,
            error=f"No reader available for format: {detected_format.value}. "
                  f"Supported formats: PicoQuant, Becker & Hickl, Photon-HDF5, CSV",
        )

    # Apply reader-specific options
    if options:
        if isinstance(reader, CSVReader) and "column_mapping" in options:
            reader.column_mapping = options["column_mapping"]

    # Read file
    result = reader.read(path)

    # Merge detection metadata into result
    result.file_metadata.update(metadata)

    return result


def _read_custom_hdf5(path: Path, metadata: Dict[str, Any]) -> ReaderResult:
    """
    Read custom HDF5 format using legacy reader.

    Falls back to the existing Full SMS HDF5 reader for backwards compatibility.
    """
    try:
        # Import legacy reader
        from api.legacy.io.hdf5_reader import read_single_measurement
        from api.services.hdf5_services import read_hdf5
    except ImportError:
        return ReaderResult(
            measurements=[],
            file_metadata=metadata,
            format_name="HDF5 Custom",
            success=False,
            error="Legacy HDF5 reader not available",
        )

    try:
        # Use existing read_hdf5 service
        result = read_hdf5(str(path))

        if isinstance(result, dict) and "measurements" in result:
            # Convert to ReaderResult format
            from .base import MeasurementResult, ChannelResult

            measurements = []
            for m in result["measurements"]:
                if isinstance(m, dict):
                    ch1_data = m.get("channel1", {})
                    ch2_data = m.get("channel2")

                    channel1 = ChannelResult(
                        abstimes=ch1_data.get("abstimes", []),
                        microtimes=ch1_data.get("microtimes", []),
                    )

                    channel2 = None
                    if ch2_data:
                        channel2 = ChannelResult(
                            abstimes=ch2_data.get("abstimes", []),
                            microtimes=ch2_data.get("microtimes", []),
                        )

                    measurement = MeasurementResult(
                        id=m.get("id", 1),
                        name=m.get("name", f"Measurement {m.get('id', 1)}"),
                        channel1=channel1,
                        channel2=channel2,
                        channelwidth=m.get("channelwidth", 0.0),
                        description=m.get("description", ""),
                        tcspc_card=m.get("tcspc_card", ""),
                        metadata=m.get("metadata", {}),
                    )
                    measurements.append(measurement)

            return ReaderResult(
                measurements=measurements,
                file_metadata={**metadata, **result.get("file_metadata", {})},
                format_name="HDF5 Custom",
                success=True,
            )

        return ReaderResult(
            measurements=[],
            file_metadata=metadata,
            format_name="HDF5 Custom",
            success=False,
            error="Unexpected result format from legacy reader",
        )

    except Exception as e:
        return ReaderResult(
            measurements=[],
            file_metadata=metadata,
            format_name="HDF5 Custom",
            success=False,
            error=f"Failed to read custom HDF5: {str(e)}",
        )


def get_supported_formats() -> List[Dict[str, Any]]:
    """
    Get list of all supported file formats with metadata.

    Returns:
        List of format info dictionaries
    """
    return [
        {
            "id": "hdf5_custom",
            "name": "Full SMS HDF5",
            "extensions": [".h5", ".hdf5"],
            "description": "Native Full SMS format with particle measurements",
            "reader": "Legacy HDF5 Reader",
        },
        {
            "id": "photon_hdf5",
            "name": "Photon-HDF5",
            "extensions": [".h5", ".hdf5"],
            "description": "Open standard for single-molecule data",
            "reader": "PhotonHDF5Reader",
        },
        {
            "id": "picoquant",
            "name": "PicoQuant",
            "extensions": [".ptu", ".phu"],
            "description": "PicoQuant TCSPC formats (PTU, PicoHarp)",
            "reader": "PicoQuantReader",
        },
        
        {
            "id": "becker_hickl",
            "name": "Becker & Hickl",
            "extensions": [".sdt", ".spc"],
            "description": "Becker & Hickl TCSPC formats",
            "reader": "BeckerHicklReader",
        },
        {
            "id": "csv",
            "name": "CSV/Text",
            "extensions": [".csv", ".txt", ".tsv"],
            "description": "Delimited text files with timestamp data",
            "reader": "CSVReader",
        },
    ]


def get_all_supported_extensions() -> List[str]:
    """Get flat list of all supported file extensions."""
    extensions = set()
    for reader in _READERS:
        extensions.update(reader.get_supported_extensions())
    # Add HDF5 extensions for custom format
    extensions.update([".h5", ".hdf5"])
    return sorted(extensions)
