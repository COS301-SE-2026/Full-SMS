from types import SimpleNamespace
from unittest.mock import patch
import numpy as np
from services.hdf5_services import read_hdf5, read_ifr

def test_read_hdf5_maps_metadata_and_measurements():
    metadata = SimpleNamespace(
        filename="file.h5",
        num_measurements=1,
        has_spectra=False,
        has_raster=True,
    )
    measurements = [
        SimpleNamespace(
            id="m1",
            name="Particle 1",
            channelwidth=12.5,
            description="test",
        )
    ]

    with patch("services.hdf5_services.load_h5_file", return_value=(metadata, measurements)):
        result = read_hdf5("fake-path")

    assert result["metadata"]["filename"] == "file.h5"
    assert result["metadata"]["num_measurements"] == 1
    assert result["metadata"]["has_spectra"] is False
    assert result["metadata"]["has_rasters"] is True
    assert result["measurements"][0]["channelWidth"] == 12.5

def test_read_ifr_none():
    with patch("services.hdf5_services.load_irf", return_value=None):
        assert read_ifr("fake-path") is None

def test_read_ifr_maps_arrays():
    with patch("services.hdf5_services.load_irf", return_value=(np.array([1, 2]), np.array([10, 20]))):
        result = read_ifr("fake-path")
    assert result == {"t": [1, 2], "counts": [10, 20]}