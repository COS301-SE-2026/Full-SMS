# base classes for the file readers
# every reader inherits FileReader and hands back a ReaderResult

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import List, Optional, Dict, Any
from pathlib import Path
import numpy as np

@dataclass
class NativeDataBlock:
    id: int
    name: str
    kind: str
    data: np.ndarray
    axes: Dict[str, np.ndarray] = field(default_factory=dict)
    axis_units: Dict[str, str] = field(default_factory=dict)
    metadata: Dict[str, Any] = field(default_factory=dict)

@dataclass
class ChannelResult:
    # abstimes = arrival times in ns, microtimes = tcspc times in ns
    abstimes: np.ndarray
    microtimes: np.ndarray

    def __post_init__(self):
        # lists come in from the legacy reader so convert them
        if not isinstance(self.abstimes, np.ndarray):
            self.abstimes = np.array(self.abstimes, dtype=np.float64)
        if not isinstance(self.microtimes, np.ndarray):
            self.microtimes = np.array(self.microtimes, dtype=np.float64)

    @property
    def photon_count(self) -> int:
        return len(self.abstimes)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "abstimes": self.abstimes.tolist(),
            "microtimes": self.microtimes.tolist(),
            "photon_count": self.photon_count,
        }


@dataclass
class MeasurementResult:
    # one measurement/particle out of a file, id is 1 based
    id: int
    name: str
    channel1: ChannelResult
    channel2: Optional[ChannelResult] = None
    channelwidth: float = 0.0   # ns
    description: str = ""
    tcspc_card: str = ""
    metadata: Dict[str, Any] = field(default_factory=dict)

    @property
    def has_dual_channel(self) -> bool:
        return self.channel2 is not None and self.channel2.photon_count > 0

    @property
    def total_photons(self) -> int:
        total = self.channel1.photon_count
        if self.channel2:
            total += self.channel2.photon_count
        return total

    def to_dict(self) -> Dict[str, Any]:
        result = {
            "id": self.id,
            "name": self.name,
            "channel1": self.channel1.to_dict(),
            "channelwidth": self.channelwidth,
            "description": self.description,
            "tcspc_card": self.tcspc_card,
            "metadata": self.metadata,
            "has_dual_channel": self.has_dual_channel,
            "total_photons": self.total_photons,
        }
        if self.channel2:
            result["channel2"] = self.channel2.to_dict()
        return result


@dataclass
class ReaderResult:
    measurements: List[MeasurementResult]
    file_metadata: Dict[str, Any]
    format_name: str
    success: bool = True
    error: Optional[str] = None
    native_blocks: List[NativeDataBlock] = field(default_factory=list)
    data_kind: str = "photon_events"

    @property
    def measurement_count(self) -> int:
        return len(self.measurements)

    @property
    def total_photons(self) -> int:
        return sum(m.total_photons for m in self.measurements)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "success": self.success,
            "error": self.error,
            "format_name": self.format_name,
            "measurement_count": self.measurement_count,
            "total_photons": self.total_photons,
            "file_metadata": self.file_metadata,
            "measurements": [m.to_dict() for m in self.measurements],
        }


class FileReader(ABC):
    # subclasses need can_read, read and get_supported_extensions

    @abstractmethod
    def can_read(self, path: Path) -> bool:
        pass

    @abstractmethod
    def read(self, path: Path) -> ReaderResult:
        pass

    @abstractmethod
    def get_supported_extensions(self) -> List[str]:
        pass

    def get_format_name(self) -> str:
        return self.__class__.__name__.replace("Reader", "")

    def _create_error_result(self, error: str) -> ReaderResult:
        return ReaderResult(
            measurements=[],
            file_metadata={},
            format_name=self.get_format_name(),
            success=False,
            error=error,
        )

    def _calculate_channelwidth(self, microtimes: np.ndarray) -> float:
        # smallest positive gap between unique microtimes, 10 ps if we cant tell
        if len(microtimes) < 2:
            return 0.01

        unique_times = np.unique(microtimes)
        if len(unique_times) < 2:
            return 0.01

        diffs = np.diff(np.sort(unique_times))
        positive_diffs = diffs[diffs > 0]

        if len(positive_diffs) == 0:
            return 0.01

        return float(np.min(positive_diffs))