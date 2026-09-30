import sys
from types import SimpleNamespace

import numpy as np

from api.services.file_readers.bh_reader import BeckerHicklReader


def test_bh_histogram_is_returned_without_photon_expansion(tmp_path, monkeypatch):
    path = tmp_path / "decay.sdt"
    path.write_bytes(b"test")
    counts = np.array([0, 3, 2, 8], dtype=np.uint32)
    times = np.array([0.0, 0.1, 0.2, 0.3])
    sdt = SimpleNamespace(
        data=[counts],
        times=[times],
        info="",
        measure_info=[],
        setup=SimpleNamespace(),
    )
    monkeypatch.setitem(sys.modules, "sdtfile", SimpleNamespace(SdtFile=lambda _: sdt))

    result = BeckerHicklReader().read(path)

    assert result.success
    assert result.data_kind == "native_data"
    assert result.measurements == []
    assert len(result.native_blocks) == 1
    assert result.native_blocks[0].kind == "decay_histogram"
    np.testing.assert_array_equal(result.native_blocks[0].data, counts)
    np.testing.assert_array_equal(result.native_blocks[0].axes["time"], times)


def test_bh_reader_preserves_flim_shape():
    data = np.arange(24).reshape(2, 3, 4)
    times = np.arange(4, dtype=np.float64)

    block = BeckerHicklReader()._process_data_block(data, times, 0, {})

    assert block is not None
    assert block.kind == "flim"
    assert block.data.shape == (2, 3, 4)
    np.testing.assert_array_equal(block.data, data)