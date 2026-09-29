"""
Base classes and interfaces for file format readers.
All file readers must inherit from FileReader and return ReaderResult.
"""

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
    """
    Single channel photon data.

    Attributes:
        abstimes: Absolute arrival times in nanoseconds (uint64 or float64)
        microtimes: Micro times (TCSPC times) in nanoseconds (float64)
    """
    abstimes: np.ndarray
    microtimes: np.ndarray

    def __post_init__(self):
        # Ensure arrays are numpy arrays
        if not isinstance(self.abstimes, np.ndarray):
            self.abstimes = np.array(self.abstimes, dtype=np.float64)
        if not isinstance(self.microtimes, np.ndarray):
            self.microtimes = np.array(self.microtimes, dtype=np.float64)

    @property
    def photon_count(self) -> int:
        """Number of photons in this channel."""
        return len(self.abstimes)

    def to_dict(self) -> Dict[str, Any]:
        """Convert to JSON-serializable dictionary."""
        return {
            "abstimes": self.abstimes.tolist(),
            "microtimes": self.microtimes.tolist(),
            "photon_count": self.photon_count,
        }


@dataclass
class MeasurementResult:
    """
    Single measurement/particle data extracted from a file.

    Attributes:
        id: Measurement ID (1-based)
        name: Display name for the measurement
        channel1: Primary channel photon data
        channel2: Optional secondary channel photon data
        channelwidth: TCSPC channel width in nanoseconds
        description: Optional description/notes
        tcspc_card: TCSPC hardware identifier
        metadata: Additional format-specific metadata
    """
    id: int
    name: str
    channel1: ChannelResult
    channel2: Optional[ChannelResult] = None
    channelwidth: float = 0.0
    description: str = ""
    tcspc_card: str = ""
    metadata: Dict[str, Any] = field(default_factory=dict)

    @property
    def has_dual_channel(self) -> bool:
        """Check if measurement has dual channel data."""
        return self.channel2 is not None and self.channel2.photon_count > 0

    @property
    def total_photons(self) -> int:
        """Total photon count across all channels."""
        total = self.channel1.photon_count
        if self.channel2:
            total += self.channel2.photon_count
        return total

    def to_dict(self) -> Dict[str, Any]:
        """Convert to JSON-serializable dictionary."""
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
    """
    Result from reading a file.

    Attributes:
        measurements: List of measurements extracted from the file
        file_metadata: Metadata about the file (format version, creation time, etc.)
        format_name: Human-readable format name
        success: Whether reading was successful
        error: Error message if reading failed
    """
    measurements: List[MeasurementResult]
    file_metadata: Dict[str, Any]
    format_name: str
    success: bool = True
    error: Optional[str] = None
    native_blocks: List[NativeDataBlock] = field(default_factory=list)
    data_kind: str = "photon_events"

    @property
    def measurement_count(self) -> int:
        """Number of measurements in the file."""
        return len(self.measurements)

    @property
    def total_photons(self) -> int:
        """Total photons across all measurements."""
        return sum(m.total_photons for m in self.measurements)

    def to_dict(self) -> Dict[str, Any]:
        """Convert to JSON-serializable dictionary."""
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
    """
    Abstract base class for all file format readers.

    Subclasses must implement:
    - can_read(): Check if file can be handled
    - read(): Read file and return ReaderResult
    - get_supported_extensions(): List of supported extensions
    """

    @abstractmethod
    def can_read(self, path: Path) -> bool:
        """
        Check if this reader can handle the given file.

        Args:
            path: Path to the file

        Returns:
            True if this reader can handle the file
        """
        pass

    @abstractmethod
    def read(self, path: Path) -> ReaderResult:
        """
        Read the file and return measurement data.

        Args:
            path: Path to the file to read

        Returns:
            ReaderResult with measurements or error
        """
        pass

    @abstractmethod
    def get_supported_extensions(self) -> List[str]:
        """
        Get list of supported file extensions.

        Returns:
            List of extensions
        """
        pass

    def get_format_name(self) -> str:
        """Get human-readable format name."""
        return self.__class__.__name__.replace("Reader", "")

    def _create_error_result(self, error: str) -> ReaderResult:
        """Helper to create an error result."""
        return ReaderResult(
            measurements=[],
            file_metadata={},
            format_name=self.get_format_name(),
            success=False,
            error=error,
        )

    def _calculate_channelwidth(self, microtimes: np.ndarray) -> float:
        """
        Calculate TCSPC channel width from microtime data.

        Args:
            microtimes: Array of microtime values

        Returns:
            Estimated channel width in nanoseconds
        """
        if len(microtimes) < 2:
            return 0.01  # Default 10 ps

        unique_times = np.unique(microtimes)
        if len(unique_times) < 2:
            return 0.01

        # Find smallest positive difference
        diffs = np.diff(np.sort(unique_times))
        positive_diffs = diffs[diffs > 0]

        if len(positive_diffs) == 0:
            return 0.01

        return float(np.min(positive_diffs))
