import numpy as np

from api.legacy.models.measurement import ChannelData, MeasurementData
from api.services.file_readers.base import ChannelResult, MeasurementResult


def _to_legacy_channel(channel: ChannelResult) -> ChannelData:
    abstimes = np.asarray(channel.abstimes)
    microtimes = np.asarray(channel.microtimes, dtype=np.float64)

    # legacy code assumes clean 1d arrays so check before converting
    if abstimes.ndim != 1 or microtimes.ndim != 1:
        raise ValueError("Photon time arrays must be one-dimensional")
    if len(abstimes) != len(microtimes):
        raise ValueError("Absolute and microtime arrays have different lengths")
    if not np.all(np.isfinite(abstimes)) or not np.all(np.isfinite(microtimes)):
        raise ValueError("Photon time arrays contain non-finite values")
    if np.any(abstimes < 0) or np.any(microtimes < 0):
        raise ValueError("Photon times must be non-negative")

    # legacy abstimes are uint64
    abstimes = np.rint(abstimes).astype(np.uint64)
    return ChannelData(abstimes=abstimes, microtimes=microtimes)


def to_legacy_measurement(measurement: MeasurementResult) -> MeasurementData:
    return MeasurementData(
        id=measurement.id,
        name=measurement.name,
        tcspc_card=measurement.tcspc_card,
        channelwidth=measurement.channelwidth,
        channel1=_to_legacy_channel(measurement.channel1),
        channel2=(
            _to_legacy_channel(measurement.channel2)
            if measurement.channel2 is not None
            else None
        ),
        description=measurement.description,
    )