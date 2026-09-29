"""
PicoQuant file format reader.

Supports: .ptu, .pt3, .pt2, .ht3, .t3r formats
Uses the ptufile library (https://github.com/cgohlke/ptufile)
"""

from pathlib import Path
from typing import List
import numpy as np

from .base import FileReader, ReaderResult, MeasurementResult, ChannelResult


class PicoQuantReader(FileReader):
    """
    Reader for PicoQuant TCSPC file formats.

    Supported formats:
    - .ptu: Unified TTTR format (PicoQuant unified)
    - .pt3: PicoHarp 300 T3 mode
    - .pt2: PicoHarp 300 T2 mode
    - .ht3: HydraHarp 400 T3 mode
    - .t3r: TimeHarp 200 T3 mode

    Requires: pip install ptufile
    """

    def get_supported_extensions(self) -> List[str]:
        return [".ptu", ".pt3", ".pt2", ".ht3", ".t3r"]

    def can_read(self, path: Path) -> bool:
        """Check if file has a PicoQuant extension."""
        return path.suffix.lower() in self.get_supported_extensions()

    def read(self, path: Path) -> ReaderResult:
        """
        Read PicoQuant file and extract photon data.

        The ptufile library decodes TTTR records into:
        - channel: detector channel index
        - dtime: micro time (TCSPC bin)
        - nsync: macro time (sync pulse count)
        - marker: marker events
        - special: special records flag
        """
        # Check for ptufile library
        try:
            import ptufile
        except ImportError:
            return self._create_error_result(
                "ptufile library not installed. Install with: pip install ptufile"
            )

        path = Path(path)

        if not path.exists():
            return self._create_error_result(f"File not found: {path}")

        try:
            with ptufile.PtuFile(path) as ptu:
                # Extract file metadata
                file_metadata = self._extract_metadata(ptu)

                # Decode photon records
                decoded = ptu.decode_records()

                if decoded is None or decoded.size == 0:
                    return self._create_error_result("No photon records found in file.")

                # decoded is a structured record array, not a five-item tuple
                times = decoded["time"]
                dtime = decoded["dtime"]
                channel = decoded["channel"]
                marker = decoded["marker"]

                # Filter out special/marker records (keep only actual photons)
                photon_mask = marker == 0
                times = times[photon_mask]
                dtime = dtime[photon_mask]
                channel = channel[photon_mask]

                if len(channel) == 0:
                    return self._create_error_result(
                        "No photon events found after filtering special records."
                    )

                # Get time resolutions
                global_res_ns = ptu.global_resolution * 1e9  # Convert s to ns
                tcspc_res_ns = ptu.tcspc_resolution * 1e9    # Convert s to ns

                # Convert to absolute times in nanoseconds
                abstimes = times.astype(np.float64) * global_res_ns
                microtimes = dtime.astype(np.float64) * tcspc_res_ns

                # Group photons by detector channel
                measurements = self._group_by_channel(
                    channel, abstimes, microtimes, tcspc_res_ns, ptu, file_metadata
                )

                return ReaderResult(
                    measurements=measurements,
                    file_metadata=file_metadata,
                    format_name="PicoQuant",
                    success=True,
                )

        except Exception as e:
            return self._create_error_result(f"Failed to read PicoQuant file: {str(e)}")

    def _extract_metadata(self, ptu) -> dict:
        """Extract metadata from PicoQuant file."""
        metadata = {
            "format": getattr(ptu, "type", "PicoQuant"),
            "measurement_type": getattr(ptu, "measurement_type", None),
            "measurement_subtype": getattr(ptu, "measurement_subtype", None),
            "number_of_records": getattr(ptu, "number_of_records", 0),
            "global_resolution_s": getattr(ptu, "global_resolution", 0),
            "tcspc_resolution_s": getattr(ptu, "tcspc_resolution", 0),
            "global_resolution_ns": getattr(ptu, "global_resolution", 0) * 1e9,
            "tcspc_resolution_ns": getattr(ptu, "tcspc_resolution", 0) * 1e9,
        }

        # Optional metadata
        if hasattr(ptu, "creation_time") and ptu.creation_time:
            metadata["creation_time"] = str(ptu.creation_time)

        if hasattr(ptu, "comment") and ptu.comment:
            metadata["comment"] = ptu.comment

        # Try to get acquisition time
        if hasattr(ptu, "acquisition_time"):
            metadata["acquisition_time_s"] = ptu.acquisition_time

        return metadata

    def _group_by_channel(
        self,
        channel: np.ndarray,
        abstimes: np.ndarray,
        microtimes: np.ndarray,
        tcspc_res_ns: float,
        ptu,
        file_metadata: dict,
    ) -> List[MeasurementResult]:
        """
        Group photons by detector channel and create measurements.

        For single-channel data, creates one measurement.
        For multi-channel data, can either:
        - Create separate measurements per channel
        - Combine into dual-channel measurement (channels 0 and 1)
        """
        unique_channels = np.unique(channel)
        measurements = []

        # Determine if we should create dual-channel measurement
        # (common case: channels 0 and 1 represent two detectors)
        if len(unique_channels) == 2 and set(unique_channels) == {0, 1}:
            # Create single dual-channel measurement
            ch0_mask = channel == 0
            ch1_mask = channel == 1

            measurement = MeasurementResult(
                id=1,
                name="Measurement 1",
                channel1=ChannelResult(
                    abstimes=abstimes[ch0_mask],
                    microtimes=microtimes[ch0_mask],
                ),
                channel2=ChannelResult(
                    abstimes=abstimes[ch1_mask],
                    microtimes=microtimes[ch1_mask],
                ),
                channelwidth=tcspc_res_ns,
                description=file_metadata.get("comment", ""),
                tcspc_card=file_metadata.get("format", "PicoQuant"),
                metadata={
                    "channel1_detector": 0,
                    "channel2_detector": 1,
                    "photon_count_ch1": int(ch0_mask.sum()),
                    "photon_count_ch2": int(ch1_mask.sum()),
                },
            )
            measurements.append(measurement)
        else:
            # Create separate measurement for each channel
            for i, ch in enumerate(unique_channels):
                ch_mask = channel == ch

                measurement = MeasurementResult(
                    id=i + 1,
                    name=f"Channel {ch}" if len(unique_channels) > 1 else "Measurement 1",
                    channel1=ChannelResult(
                        abstimes=abstimes[ch_mask],
                        microtimes=microtimes[ch_mask],
                    ),
                    channelwidth=tcspc_res_ns,
                    description=file_metadata.get("comment", ""),
                    tcspc_card=file_metadata.get("format", "PicoQuant"),
                    metadata={
                        "detector_channel": int(ch),
                        "photon_count": int(ch_mask.sum()),
                    },
                )
                measurements.append(measurement)

        return measurements
