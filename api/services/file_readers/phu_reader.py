"""Reader for PicoQuant .phu files — TCSPC decay histograms, typically
paired with .ptu FLIM data, read via the ptufile library."""

from pathlib import Path
from typing import List

import numpy as np

from .base import FileReader, NativeDataBlock, ReaderResult


class PicoQuantPhuReader(FileReader):
    """_summary_

    Args:
        FileReader (_type_): _description_
    """
    def get_supported_extensions(self) -> List[str]:
        return [".phu"]

    def can_read(self, path: Path) -> bool:
        return path.suffix.lower() == ".phu"

    def read(self, path: Path) -> ReaderResult:
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
            with ptufile.PhuFile(path) as phu:
                histograms = phu.histograms()
                resolutions = phu.histogram_resolutions or ()
                blocks = []

                for index, histogram in enumerate(histograms):
                    counts = np.asarray(histogram)
                    if counts.ndim != 1 or counts.size == 0:
                        continue

                    # Some files carry a resolution per channel; fall back to
                    # the TCSPC resolution when that's not the case.
                    resolution_s = (
                        float(resolutions[index])
                        if index < len(resolutions) and resolutions[index]
                        else float(phu.tcspc_resolution)
                    )
                    
                    # Bin-center timestamps (hence the +0.5), converted to ns.
                    time_ns = (
                        np.arange(counts.size, dtype=np.float64) + 0.5
                    ) * resolution_s * 1e9

                    blocks.append(
                        NativeDataBlock(
                            id=index + 1,
                            name=f"Channel {index + 1}",
                            kind="decay_histogram",
                            data=counts,
                            axes={"time": time_ns},
                            axis_units={"time": "ns"},
                            metadata={
                                "source_format": "picoquant_phu",
                                "channel": index,
                                "total_counts": int(counts.sum()),
                                "tcspc_resolution_s": resolution_s,
                            },
                        )
                    )

                if not blocks:
                    return self._create_error_result(
                        "No histogram data found in PHU file."
                    )

                return ReaderResult(
                    measurements=[],
                    file_metadata={
                        "format": "PicoQuant PHU",
                        "num_channels": len(blocks),
                    },
                    format_name="PicoQuant PHU",
                    native_blocks=blocks,
                    data_kind="native_data",
                )

        except Exception as error:
            return self._create_error_result(
                f"Failed to read PicoQuant PHU file: {error}"
            )