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

    def _extract_metadata(self, f) -> Dict[str, Any]:
        metadata = {
            "format": "Photon-HDF5",
        }

        for attr in ["acquisition_duration", "description", "author", "sample_name"]:
            if attr in f.attrs:
                val = f.attrs[attr]
                if isinstance(val, bytes):
                    val = val.decode("utf-8")
                metadata[attr] = val

        if "identity" in f:
            identity = f["identity"]
            for key in ["author", "author_affiliation", "creation_time", "format_name"]:
                if key in identity:
                    val = identity[key][()]
                    if isinstance(val, bytes):
                        val = val.decode("utf-8")
                    metadata[f"identity_{key}"] = val

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