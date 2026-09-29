# becker & hickl reader (.sdt, .spc) using sdtfile
# pip install sdtfile

from pathlib import Path
from typing import List, Optional
import numpy as np

from .base import FileReader, NativeDataBlock, ReaderResult


class BeckerHicklReader(FileReader):
    # b&h files are usually histograms not raw photon timestamps

    def get_supported_extensions(self) -> List[str]:
        return [".sdt", ".spc"]

    def can_read(self, path: Path) -> bool:
        return path.suffix.lower() in self.get_supported_extensions()

    def read(self, path: Path) -> ReaderResult:
        try:
            import sdtfile
        except ImportError:
            return self._create_error_result(
                "sdtfile library not installed. Install with: pip install sdtfile"
            )

        path = Path(path)

        if not path.exists():
            return self._create_error_result(f"File not found: {path}")

        try:
            sdt = sdtfile.SdtFile(path)
            file_metadata = self._extract_metadata(sdt)
            native_blocks = []

            for block_idx, data in enumerate(sdt.data):
                if data is None or data.size == 0:
                    continue

                times = self._get_time_axis(sdt, block_idx)

                if times is None:
                    # no axis in the file, guess from the shape (10 ps bins)
                    times = np.arange(data.shape[-1], dtype=np.float64) * 0.01

                block = self._process_data_block(data, times, block_idx, file_metadata)

                if block:
                    native_blocks.append(block)

            if not native_blocks:
                return self._create_error_result("No valid data blocks found in B&H file.")

            return ReaderResult(
                measurements=[],
                file_metadata=file_metadata,
                format_name="Becker & Hickl",
                success=True,
                native_blocks=native_blocks,
                data_kind="native_data",
            )

        except Exception as e:
            return self._create_error_result(f"Failed to read B&H file: {str(e)}")

    def _extract_metadata(self, sdt) -> dict:
        metadata = {
            "format": "Becker & Hickl SDT",
            "num_blocks": len(sdt.data) if hasattr(sdt, "data") else 0,
        }

        if hasattr(sdt, "info") and sdt.info:
            metadata["info"] = sdt.info

        if hasattr(sdt, "measure_info"):
            for i, info in enumerate(sdt.measure_info):
                if info:
                    metadata[f"block_{i}_info"] = str(info)

        if hasattr(sdt, "setup"):
            setup = sdt.setup
            if hasattr(setup, "tac_range"):
                metadata["tac_range_ns"] = setup.tac_range * 1e9
            if hasattr(setup, "tac_gain"):
                metadata["tac_gain"] = setup.tac_gain
            if hasattr(setup, "adc_resolution"):
                metadata["adc_resolution"] = setup.adc_resolution

        return metadata

    def _get_time_axis(self, sdt, block_idx: int) -> Optional[np.ndarray]:
        if not hasattr(sdt, "times") or not sdt.times:
            return None

        if block_idx < len(sdt.times) and sdt.times[block_idx] is not None:
            times = sdt.times[block_idx]
            # probably seconds if its this small, convert to ns
            if times.max() < 1e-6:
                times = times * 1e9
            return times

        return None

    def _process_data_block(
        self,
        data: np.ndarray,
        times: np.ndarray,
        block_idx: int,
        file_metadata: dict,
    ) -> Optional[NativeDataBlock]:
        # 1D = one decay, 2D = curve matrix / time trace, 3D = flim (y, x, time)
        data = np.asarray(data)
        times = np.asarray(times, dtype=np.float64)
        if data.ndim not in (1, 2, 3):
            return None

        if data.shape[-1] != len(times):
            times = np.arange(data.shape[-1], dtype=np.float64) * 0.01

        if data.ndim == 1:
            kind = "decay_histogram"
        elif data.ndim == 2:
            kind = "curve_matrix"
        else:
            kind = "flim"

        axes = {"time": times}
        axis_units = {"time": "ns"}
        for axis_index, axis_size in enumerate(data.shape[:-1]):
            axis_name = f"axis_{axis_index}"
            axes[axis_name] = np.arange(axis_size)
            axis_units[axis_name] = "index"

        return NativeDataBlock(
            id=block_idx + 1,
            name=f"Block {block_idx + 1}",
            kind=kind,
            data=data,
            axes=axes,
            axis_units=axis_units,
            metadata={
                "original_shape": list(data.shape),
                "total_counts": int(data.sum()),
                "source_format": "becker_hickl",
                **file_metadata,
            },
        )