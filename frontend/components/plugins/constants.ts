export const DEFAULT_SCRIPT = `def run(data, params):
    """
    Plugin entry point for custom analysis.

    Args:
        data: dict containing:
            - microtimes: Microtime (TCSPC) arrival times in nanoseconds
            - abstimes: Absolute photon arrival times in nanoseconds
            - channel: Channel number
            - metadata: File metadata dict
        params: dict with user-configured parameter values

    Returns:
        dict mapping output IDs to result values
    """
    import numpy as np

    microtimes = np.array(data['microtimes'])
    bin_width = params.get('bin_width', 0.1)

    if len(microtimes) == 0:
        return {'decay_histogram': {'bins': [], 'counts': []}}

    # Build decay histogram from microtimes
    tmin = np.min(microtimes)
    tmax = np.max(microtimes)
    bin_edges = np.arange(tmin, tmax + bin_width, bin_width)

    counts, edges = np.histogram(microtimes, bins=bin_edges)
    t = edges[:-1]

    return {
        'decay_histogram': {
            'bins': t.tolist(),
            'counts': counts.tolist(),
            'xlabel': 'Time (ns)',
            'ylabel': 'Counts',
            'title': 'Decay Histogram'
        }
    }
`;

export const SCRIPT_HELP_TEXT = `import numpy as np

# Get parameters (convert from strings)
channelwidth = float(get_parameter("channelwidth", 0.1))  # TCSPC bin width in ns

# Get microtime data
microtimes = get_microtimes()

if len(microtimes) > 0:
    # Determine histogram range
    tmin = max(0, float(np.min(microtimes)))
    tmax = float(np.max(microtimes))

    # Create bin edges aligned to channel width
    bin_edges = np.arange(tmin, tmax + channelwidth, channelwidth)

    if len(bin_edges) >= 2:
        # Build histogram
        counts, edges = np.histogram(microtimes, bins=bin_edges)
        t = edges[:-1]

        # Filter out negative times
        positive_mask = t > 0
        t = t[positive_mask]
        counts = counts[positive_mask]

        set_output("decay_histogram", {
            "bins": t.tolist(),
            "counts": counts.tolist(),
            "title": "TCSPC Decay Histogram",
            "xlabel": "Time (ns)",
            "ylabel": "Counts"
        })
        set_output("photon_count", int(len(microtimes)))`;
