from api.legacy.io.hdf5_reader import load_h5_file, load_irf

def _channel_to_dict(channel):
    if channel is None:
        return None
    return {
        "abstimes": channel.abstimes.tolist(),
        "microtimes": channel.microtimes.tolist(),
    }

def _spectra_to_dict(spectra):
    return{
        "data": spectra.data.tolist(),
        "wavelengths": spectra.wavelengths.tolist(),
        "series_times": spectra.series_times.tolist(),
        "exposure_time": spectra.exposure_time,
    }

def _raster_to_dict(raster):
    return{
        "data": raster.data.tolist(),
        "x_start": raster.x_start,
        "y_start": raster.y_start,
        "scan_range": raster.scan_range,
        "pixels_per_line": raster.pixels_per_line,
        "integration_time": raster.integration_time,    
    }

def read_hdf5(path):
    metadata, measurements = load_h5_file(path)
    return {
        "metadata": {
            "filename": metadata.filename,
            "num_measurements": metadata.num_measurements,
            "has_spectra": metadata.has_spectra,
            "has_rasters": metadata.has_raster,
        },
        "measurements": [
            {
                "id": m.id,
                "name": m.name,
                "channelWidth": m.channelwidth,
                "description": m.description,
                # "channel1": _channel_to_dict(m.channel1),
                # "channel2": _channel_to_dict(m.channel2),
                # "spectra": _spectra_to_dict(m.spectra) if m.spectra else None,
                # "raster_scan": _raster_to_dict(m.raster_scan) if m.raster_scan else None,
                # "raster_scan_coord": m.raster_scan_coord,
            }
            for m in measurements
        ],
        
    }   

def read_ifr(path):
    result = load_irf(path)
    if result is None:
        return None
    t, counts = result
    return {
        "t": t.tolist(),
        "counts": counts.tolist(),
    }
