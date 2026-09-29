# csv/text reader (.csv .txt .tsv), column names get auto matched from the aliases below

from pathlib import Path
from typing import List, Dict, Optional, Any
import numpy as np

from .base import FileReader, ReaderResult, MeasurementResult, ChannelResult


ABSTIME_ALIASES = [
    "abstimes", "abstime", "absolute_time", "absolute_times",
    "arrival_time", "arrival_times", "timestamp", "timestamps",
    "time", "t", "macro_time", "macrotime", "nsync",
]

MICROTIME_ALIASES = [
    "microtimes", "microtime", "micro_time", "micro_times",
    "nanotime", "nanotimes", "nano_time", "nano_times",
    "tcspc", "tcspc_time", "dtime", "dt",
]

CHANNEL_ALIASES = [
    "channel", "ch", "detector", "det", "detector_id",
]


class CSVReader(FileReader):
    # abstime column is required, microtime + channel are optional

    def __init__(self, column_mapping: Optional[Dict[str, str]] = None):
        # e.g. {"abstimes": "arrival_time_ns", "microtimes": "tcspc_bin"}
        self.column_mapping = column_mapping or {}

    def get_supported_extensions(self) -> List[str]:
        return [".csv", ".txt", ".tsv"]

    def can_read(self, path: Path) -> bool:
        return path.suffix.lower() in self.get_supported_extensions()

    def read(self, path: Path, delimiter: Optional[str] = None) -> ReaderResult:
        path = Path(path)

        if not path.exists():
            return self._create_error_result(f"File not found: {path}")

        # tsv gets a tab, everything else is comma
        if delimiter is None:
            if path.suffix.lower() == ".tsv":
                delimiter = "\t"
            else:
                delimiter = ","

        try:
            try:
                return self._read_with_pandas(path, delimiter)
            except ImportError:
                # no pandas, use numpy instead
                return self._read_with_numpy(path, delimiter)

        except Exception as e:
            return self._create_error_result(f"Failed to read CSV file: {str(e)}")

    def _read_with_pandas(self, path: Path, delimiter: str) -> ReaderResult:
        import pandas as pd

        df = pd.read_csv(path, delimiter=delimiter)

        file_metadata = {
            "format": "CSV",
            "columns": list(df.columns),
            "rows": len(df),
            "delimiter": delimiter,
        }

        abstime_col = self._find_column(df.columns, "abstimes", ABSTIME_ALIASES)
        microtime_col = self._find_column(df.columns, "microtimes", MICROTIME_ALIASES)
        channel_col = self._find_column(df.columns, "channel", CHANNEL_ALIASES)

        if abstime_col is None:
            return self._create_error_result(
                f"Could not find timestamp column. "
                f"Available columns: {list(df.columns)}. "
                f"Expected one of: {ABSTIME_ALIASES}"
            )

        abstimes = df[abstime_col].values.astype(np.float64)

        if microtime_col is not None:
            microtimes = df[microtime_col].values.astype(np.float64)
        else:
            microtimes = np.zeros_like(abstimes)

        channelwidth = self._calculate_channelwidth(microtimes)

        file_metadata["column_mapping"] = {
            "abstimes": abstime_col,
            "microtimes": microtime_col,
            "channel": channel_col,
        }

        if channel_col is not None:
            channels = df[channel_col].values
            measurements = self._create_multi_channel_measurements(
                abstimes, microtimes, channels, channelwidth, path.stem
            )
        else:
            measurements = [
                MeasurementResult(
                    id=1,
                    name=path.stem,
                    channel1=ChannelResult(abstimes=abstimes, microtimes=microtimes),
                    channelwidth=channelwidth,
                    tcspc_card="CSV Import",
                    metadata={
                        "source_file": path.name,
                        "photon_count": len(abstimes),
                    },
                )
            ]

        return ReaderResult(
            measurements=measurements,
            file_metadata=file_metadata,
            format_name="CSV",
            success=True,
        )

    def _read_with_numpy(self, path: Path, delimiter: str) -> ReaderResult:
        # fallback, no channel column support here
        with open(path, "r") as f:
            header_line = f.readline().strip()

        columns = [col.strip().strip('"').strip("'") for col in header_line.split(delimiter)]

        file_metadata = {
            "format": "CSV",
            "columns": columns,
            "delimiter": delimiter,
        }

        abstime_col = self._find_column(columns, "abstimes", ABSTIME_ALIASES)
        microtime_col = self._find_column(columns, "microtimes", MICROTIME_ALIASES)

        if abstime_col is None:
            return self._create_error_result(
                f"Could not find timestamp column. "
                f"Available columns: {columns}. "
                f"Expected one of: {ABSTIME_ALIASES}"
            )

        abstime_idx = columns.index(abstime_col)
        microtime_idx = columns.index(microtime_col) if microtime_col else None

        data = np.genfromtxt(path, delimiter=delimiter, skip_header=1)

        abstimes = data[:, abstime_idx].astype(np.float64)

        if microtime_idx is not None:
            microtimes = data[:, microtime_idx].astype(np.float64)
        else:
            microtimes = np.zeros_like(abstimes)

        channelwidth = self._calculate_channelwidth(microtimes)

        file_metadata["rows"] = len(abstimes)
        file_metadata["column_mapping"] = {
            "abstimes": abstime_col,
            "microtimes": microtime_col,
        }

        measurement = MeasurementResult(
            id=1,
            name=path.stem,
            channel1=ChannelResult(abstimes=abstimes, microtimes=microtimes),
            channelwidth=channelwidth,
            tcspc_card="CSV Import",
            metadata={
                "source_file": path.name,
                "photon_count": len(abstimes),
            },
        )

        return ReaderResult(
            measurements=[measurement],
            file_metadata=file_metadata,
            format_name="CSV",
            success=True,
        )

    def _find_column(
        self,
        columns: List[str],
        mapped_name: str,
        aliases: List[str],
    ) -> Optional[str]:
        # user mapping wins, then fall back to the aliases (case insensitive)
        if mapped_name in self.column_mapping:
            custom_name = self.column_mapping[mapped_name]
            if custom_name in columns:
                return custom_name

        columns_lower = {col.lower(): col for col in columns}

        for alias in aliases:
            if alias.lower() in columns_lower:
                return columns_lower[alias.lower()]

        return None

    def _create_multi_channel_measurements(
        self,
        abstimes: np.ndarray,
        microtimes: np.ndarray,
        channels: np.ndarray,
        channelwidth: float,
        base_name: str,
    ) -> List[MeasurementResult]:
        unique_channels = np.unique(channels)
        measurements = []

        # exactly 2 channels -> one dual channel measurement
        if len(unique_channels) == 2:
            ch0, ch1 = unique_channels
            mask0 = channels == ch0
            mask1 = channels == ch1

            measurement = MeasurementResult(
                id=1,
                name=base_name,
                channel1=ChannelResult(
                    abstimes=abstimes[mask0],
                    microtimes=microtimes[mask0],
                ),
                channel2=ChannelResult(
                    abstimes=abstimes[mask1],
                    microtimes=microtimes[mask1],
                ),
                channelwidth=channelwidth,
                tcspc_card="CSV Import",
                metadata={
                    "channel1_id": ch0,
                    "channel2_id": ch1,
                    "photon_count_ch1": int(mask0.sum()),
                    "photon_count_ch2": int(mask1.sum()),
                },
            )
            measurements.append(measurement)
        else:
            # anything else -> one measurement per channel
            for i, ch in enumerate(unique_channels):
                mask = channels == ch

                measurement = MeasurementResult(
                    id=i + 1,
                    name=f"{base_name} Ch{ch}",
                    channel1=ChannelResult(
                        abstimes=abstimes[mask],
                        microtimes=microtimes[mask],
                    ),
                    channelwidth=channelwidth,
                    tcspc_card="CSV Import",
                    metadata={
                        "channel_id": ch,
                        "photon_count": int(mask.sum()),
                    },
                )
                measurements.append(measurement)

        return measurements