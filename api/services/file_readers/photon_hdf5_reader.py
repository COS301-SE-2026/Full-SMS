"""
Photon-HDF5 file format reader.

Photon-HDF5 is an open file format for timestamp-based single-molecule data.
Specification: https://photon-hdf5.github.io/

Supports: .h5, .hdf5 files with Photon-HDF5 structure
"""

from pathlib import Path
from typing import List, Optional, Dict, Any
import numpy as np

from .base import FileReader, ReaderResult, MeasurementResult, ChannelResult


class PhotonHDF5Reader(FileReader):
    """
    Reader for Photon-HDF5 format files.

    Photon-HDF5 is an open, documented format for photon timestamp data.
    Key features:
    - Standardized structure for multi-spot, multi-channel data
    - Rich metadata support
    - Widely adopted in single-molecule community

    Structure:
    /photon_data/
        timestamps           - Macro times (sync pulses)
        nanotimes           - Micro times (TCSPC)
        detectors           - Detector channel IDs (optional)
        timestamps_specs/   - Time units and overflow handling
        nanotimes_specs/    - TCSPC specs

    Requires: h5py (usually already installed)
    """

    def get_supported_extensions(self) -> List[str]:
        return [".h5", ".hdf5"]

    def can_read(self, path: Path) -> bool:
        """
        Check if file is a Photon-HDF5 file.

        Photon-HDF5 files must have /photon_data group.
        """
        if path.suffix.lower() not in self.get_supported_extensions():
            return False

        try:
            import h5py

            with h5py.File(path, "r") as f:
                # Must have photon_data group
                if "photon_data" not in f:
                    return False

                # Check for required datasets
                photon_data = f["photon_data"]
                return "timestamps" in photon_data or any(
                    k.startswith("timestamps") for k in photon_data.keys()
                )
        except Exception:
            return False

    def read(self, path: Path) -> ReaderResult:
        """
        Read Photon-HDF5 file and extract photon data.
        """
        try:
            import h5py
        except ImportError:
            return self._create_error_result(
                "h5py library not installed. Install with: pip install h5py"
            )

        path = Path(path)

        if not path.exists():
            return self._create_error_result(f"File not found: {path}")

        try:
            with h5py.File(path, "r") as f:
                # Extract file metadata
                file_metadata = self._extract_metadata(f)

                # Get photon data group
                if "photon_data" not in f:
                    return self._create_error_result(
                        "Not a valid Photon-HDF5 file: missing /photon_data group"
                    )

                photon_data = f["photon_data"]

                # Extract timestamps and nanotimes
                abstimes, timestamps_unit = self._read_timestamps(photon_data)
                microtimes, tcspc_unit = self._read_nanotimes(photon_data)

                if abstimes is None:
                    return self._create_error_result(
                        "No timestamp data found in Photon-HDF5 file"
                    )

                # Convert to nanoseconds
                abstimes_ns = abstimes.astype(np.float64) * timestamps_unit * 1e9

                if microtimes is not None:
                    microtimes_ns = microtimes.astype(np.float64) * tcspc_unit * 1e9
                    channelwidth = float(tcspc_unit * 1e9)
                else:
                    # No nanotimes - create zeros
                    microtimes_ns = np.zeros_like(abstimes_ns)
                    channelwidth = 0.0

                # Check for multi-detector data
                measurements = self._create_measurements(
                    photon_data, abstimes_ns, microtimes_ns, channelwidth, file_metadata
                )

                return ReaderResult(
                    measurements=measurements,
                    file_metadata=file_metadata,
                    format_name="Photon-HDF5",
                    success=True,
                )

        except Exception as e:
            return self._create_error_result(f"Failed to read Photon-HDF5 file: {str(e)}")

    def _extract_metadata(self, f) -> Dict[str, Any]:
        """Extract metadata from Photon-HDF5 file."""
        metadata = {
            "format": "Photon-HDF5",
        }

        # Root attributes
        for attr in ["acquisition_duration", "description", "author", "sample_name"]:
            if attr in f.attrs:
                val = f.attrs[attr]
                if isinstance(val, bytes):
                    val = val.decode("utf-8")
                metadata[attr] = val

        # Identity group
        if "identity" in f:
            identity = f["identity"]
            for key in ["author", "author_affiliation", "creation_time", "format_name"]:
                if key in identity:
                    val = identity[key][()]
                    if isinstance(val, bytes):
                        val = val.decode("utf-8")
                    metadata[f"identity_{key}"] = val

        # Setup group
        if "setup" in f:
            setup = f["setup"]
            if "num_pixels" in setup:
                metadata["num_pixels"] = int(setup["num_pixels"][()])
            if "num_spectral_ch" in setup:
                metadata["num_spectral_ch"] = int(setup["num_spectral_ch"][()])
            if "num_polarization_ch" in setup:
                metadata["num_polarization_ch"] = int(setup["num_polarization_ch"][()])
            if "num_split_ch" in setup:
                metadata["num_split_ch"] = int(setup["num_split_ch"][()])

            # Detectors
            if "detectors" in setup:
                det_group = setup["detectors"]
                detector_info = {}
                for key in det_group.keys():
                    val = det_group[key][()]
                    if isinstance(val, bytes):
                        val = val.decode("utf-8")
                    detector_info[key] = val
                metadata["detectors"] = detector_info

        return metadata

    def _read_timestamps(self, photon_data) -> tuple:
        """
        Read timestamps from photon_data group.

        Returns:
            Tuple of (timestamps_array, unit_in_seconds)
        """
        # Look for timestamps dataset
        if "timestamps" in photon_data:
            timestamps = photon_data["timestamps"][:]
        else:
            # Multi-spot files might have timestamps0, timestamps1, etc.
            for key in photon_data.keys():
                if key.startswith("timestamps"):
                    timestamps = photon_data[key][:]
                    break
            else:
                return None, 1.0

        # Get unit from specs
        unit = 1.0  # Default: assume seconds
        if "timestamps_specs" in photon_data:
            specs = photon_data["timestamps_specs"]
            if "timestamps_unit" in specs:
                unit = float(specs["timestamps_unit"][()])

        return timestamps, unit

    def _read_nanotimes(self, photon_data) -> tuple:
        """
        Read nanotimes from photon_data group.

        Returns:
            Tuple of (nanotimes_array, unit_in_seconds)
        """
        if "nanotimes" not in photon_data:
            return None, 1.0

        nanotimes = photon_data["nanotimes"][:]

        # Get TCSPC unit from specs
        unit = 1e-12  # Default: 1 ps
        if "nanotimes_specs" in photon_data:
            specs = photon_data["nanotimes_specs"]
            if "tcspc_unit" in specs:
                unit = float(specs["tcspc_unit"][()])

        return nanotimes, unit

    def _create_measurements(
        self,
        photon_data,
        abstimes: np.ndarray,
        microtimes: np.ndarray,
        channelwidth: float,
        file_metadata: Dict[str, Any],
    ) -> List[MeasurementResult]:
        """
        Create measurement objects from photon data.

        Handles both single-detector and multi-detector files.
        """
        measurements = []

        # Check for detector channel information
        if "detectors" in photon_data:
            detectors = photon_data["detectors"][:]
            unique_detectors = np.unique(detectors)

            if len(unique_detectors) == 2:
                # Common case: two detectors -> dual channel measurement
                det0, det1 = unique_detectors
                mask0 = detectors == det0
                mask1 = detectors == det1

                measurement = MeasurementResult(
                    id=1,
                    name="Measurement 1",
                    channel1=ChannelResult(
                        abstimes=abstimes[mask0],
                        microtimes=microtimes[mask0],
                    ),
                    channel2=ChannelResult(
                        abstimes=abstimes[mask1],
                        microtimes=microtimes[mask1],
                    ),
                    channelwidth=channelwidth,
                    tcspc_card="Photon-HDF5",
                    metadata={
                        "detector_ch1": int(det0),
                        "detector_ch2": int(det1),
                        "photon_count_ch1": int(mask0.sum()),
                        "photon_count_ch2": int(mask1.sum()),
                    },
                )
                measurements.append(measurement)
            else:
                # Multiple detectors -> separate measurements
                for i, det in enumerate(unique_detectors):
                    mask = detectors == det

                    measurement = MeasurementResult(
                        id=i + 1,
                        name=f"Detector {det}",
                        channel1=ChannelResult(
                            abstimes=abstimes[mask],
                            microtimes=microtimes[mask],
                        ),
                        channelwidth=channelwidth,
                        tcspc_card="Photon-HDF5",
                        metadata={
                            "detector": int(det),
                            "photon_count": int(mask.sum()),
                        },
                    )
                    measurements.append(measurement)
        else:
            # Single detector
            measurement = MeasurementResult(
                id=1,
                name="Measurement 1",
                channel1=ChannelResult(
                    abstimes=abstimes,
                    microtimes=microtimes,
                ),
                channelwidth=channelwidth,
                tcspc_card="Photon-HDF5",
                metadata={
                    "photon_count": len(abstimes),
                },
            )
            measurements.append(measurement)

        return measurements
