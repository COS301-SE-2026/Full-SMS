# photon-hdf5 reader (.h5, .hdf5), spec: https://photon-hdf5.github.io/
# needs h5py
#
# formats i care about:
#   /photon_data/timestamps, nanotimes, detectors (optional)
#   /photon_data/timestamps_specs, nanotimes_specs for the units

from pathlib import Path
from typing import List, Optional, Dict, Any
import numpy as np

from .base import FileReader, ReaderResult, MeasurementResult, ChannelResult


class PhotonHDF5Reader(FileReader):

    def get_supported_extensions(self) -> List[str]:
        return [".h5", ".hdf5"]

    def can_read(self, path: Path) -> bool:
        # has to have a /photon_data group with some kind of timestamps in it
        if path.suffix.lower() not in self.get_supported_extensions():
            return False

        try:
            import h5py

            with h5py.File(path, "r") as f:
                if "photon_data" not in f:
                    return False

                photon_data = f["photon_data"]
                return "timestamps" in photon_data or any(
                    k.startswith("timestamps") for k in photon_data.keys()
                )
        except Exception:
            return False

    def read(self, path: Path) -> ReaderResult:
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
                file_metadata = self._extract_metadata(f)

                if "photon_data" not in f:
                    return self._create_error_result(
                        "Not a valid Photon-HDF5 file: missing /photon_data group"
                    )

                photon_data = f["photon_data"]

                abstimes, timestamps_unit = self._read_timestamps(photon_data)
                microtimes, tcspc_unit = self._read_nanotimes(photon_data)

                if abstimes is None:
                    return self._create_error_result(
                        "No timestamp data found in Photon-HDF5 file"
                    )

                # units are in seconds, we want ns
                abstimes_ns = abstimes.astype(np.float64) * timestamps_unit * 1e9

                if microtimes is not None:
                    microtimes_ns = microtimes.astype(np.float64) * tcspc_unit * 1e9
                    channelwidth = float(tcspc_unit * 1e9)
                else:
                    # no nanotimes in the file, just zeros
                    microtimes_ns = np.zeros_like(abstimes_ns)
                    channelwidth = 0.0

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

    @staticmethod
    def _decode_bytes(val: Any) -> Any:
        """Decode byte strings to utf-8 if needed."""
        if isinstance(val, bytes):
            return val.decode("utf-8")
        return val

    def _extract_root_attrs(self, f) -> Dict[str, Any]:
        """Extract file attributes."""
        root_keys = ["acquisition_duration", "description", "author", "sample_name"]
        return {
            attr: self._decode_bytes(f.attrs[attr])
            for attr in root_keys
            if attr in f.attrs
        }

    def _extract_identity_metadata(self, f) -> Dict[str, Any]:
        """Extract /identity group attributes."""
        if "identity" not in f:
            return {}

        identity = f["identity"]
        keys = ["author", "author_affiliation", "creation_time", "format_name"]
        return {
            f"identity_{key}": self._decode_bytes(identity[key][()])
            for key in keys
            if key in identity
        }

    def _extract_setup_metadata(self, f) -> Dict[str, Any]:
        """Extract /setup group channels and detector info."""
        if "setup" not in f:
            return {}

        setup = f["setup"]
        setup_metadata: Dict[str, Any] = {}

        channel_keys = [
            "num_pixels",
            "num_spectral_ch",
            "num_polarization_ch",
            "num_split_ch",
        ]
        for key in channel_keys:
            if key in setup:
                setup_metadata[key] = int(setup[key][()])

        if "detectors" in setup:
            det_group = setup["detectors"]
            setup_metadata["detectors"] = {
                key: self._decode_bytes(det_group[key][()])
                for key in det_group.keys()
            }

        return setup_metadata

    def _extract_metadata(self, f) -> Dict[str, Any]:
        metadata: Dict[str, Any] = {
            "format": "Photon-HDF5",
        }
        metadata.update(self._extract_root_attrs(f))
        metadata.update(self._extract_identity_metadata(f))
        metadata.update(self._extract_setup_metadata(f))
        return metadata

    def _read_timestamps(self, photon_data) -> tuple:
        # returns (timestamps, unit in seconds)
        if "timestamps" in photon_data:
            timestamps = photon_data["timestamps"][:]
        else:
            # multi spot files can have timestamps0, timestamps1... just take the first
            for key in photon_data.keys():
                if key.startswith("timestamps"):
                    timestamps = photon_data[key][:]
                    break
            else:
                return None, 1.0

        unit = 1.0  # assume seconds if specs are missing
        if "timestamps_specs" in photon_data:
            specs = photon_data["timestamps_specs"]
            if "timestamps_unit" in specs:
                unit = float(specs["timestamps_unit"][()])

        return timestamps, unit

    def _read_nanotimes(self, photon_data) -> tuple:
        # returns (nanotimes, unit in seconds)
        if "nanotimes" not in photon_data:
            return None, 1.0

        nanotimes = photon_data["nanotimes"][:]

        unit = 1e-12  # 1 ps default
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
        measurements = []

        if "detectors" in photon_data:
            detectors = photon_data["detectors"][:]
            unique_detectors = np.unique(detectors)

            if len(unique_detectors) == 2:
                # two detectors -> one dual channel measurement
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
                # otherwise one measurement per detector
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
            # no detector info, single measurement
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