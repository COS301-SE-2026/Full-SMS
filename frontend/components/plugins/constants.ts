import { PluginParameter, PluginOutput } from "@/types/plugin";

export const DEFAULT_SCRIPT = `import numpy as np

# =============================================================================
# STEP 1: Get your parameters (values from Configuration tab)
# =============================================================================
bin_width = float(get_parameter("bin_width", 0.1))  # Default: 0.1 ns

# =============================================================================
# STEP 2: Get your measurement data
# =============================================================================
microtimes = get_microtimes()  # Returns numpy array of microtime values (ns)

# =============================================================================
# STEP 3: Process your data
# =============================================================================
if len(microtimes) > 0:
    # Build a histogram from the microtime data
    tmin = float(np.min(microtimes))
    tmax = float(np.max(microtimes))
    bin_edges = np.arange(tmin, tmax + bin_width, bin_width)

    counts, edges = np.histogram(microtimes, bins=bin_edges)
    bins = edges[:-1]  # Use left edge of each bin

    # =========================================================================
    # STEP 4: Set your outputs (IDs must match Configuration tab exactly)
    # =========================================================================
    set_output("decay_histogram", {
        "bins": bins.tolist(),      # Convert numpy array to list
        "counts": counts.tolist(),  # Convert numpy array to list
        "title": "Decay Histogram",
        "xlabel": "Time (ns)",
        "ylabel": "Counts"
    })
else:
    # Always set outputs, even when data is empty
    set_output("decay_histogram", {
        "bins": [],
        "counts": [],
        "title": "Decay Histogram (No Data)"
    })
`;

export const DEFAULT_PARAMETERS: PluginParameter[] = [
  {
    id: "bin_width",
    label: "Bin Width (ns)",
    type: "number",
    default: 0.1,
    min: 0.01,
    max: 10,
    step: 0.01,
  },
];

export const DEFAULT_OUTPUTS: PluginOutput[] = [
  { id: "decay_histogram", label: "Decay Histogram", type: "histogram" },
];

export const SCRIPT_GUIDE_EXAMPLE = `import numpy as np

# Get parameters from Configuration tab
num_bins = int(get_parameter("num_bins", 50))

# Get measurement data
microtimes = get_microtimes()

# Process and set outputs
if len(microtimes) > 0:
    counts, edges = np.histogram(microtimes, bins=num_bins)
    set_output("my_histogram", {
        "bins": edges[:-1].tolist(),
        "counts": counts.tolist()
    })
    set_output("total_photons", len(microtimes))
else:
    set_output("my_histogram", {"bins": [], "counts": []})
    set_output("total_photons", 0)`;

export const SCRIPT_GUIDE_SECTIONS = {
  quickStart: {
    title: "Quick Start - 4 Simple Steps",
    content: `Every plugin follows the same 4-step pattern:

1. GET PARAMETERS  -  Values from Configuration tab
2. GET DATA        -  Measurement data (microtimes, abstimes)
3. PROCESS         -  Your analysis logic
4. SET OUTPUTS     -  Results (IDs must match Configuration tab)`,
  },

  functions: {
    title: "Available Functions",
    items: [
      {
        name: "get_parameter(name, default)",
        description: "Get a parameter value from Configuration tab",
        example: `bin_width = float(get_parameter("bin_width", 0.1))
threshold = int(get_parameter("threshold", 100))`,
      },
      {
        name: "get_microtimes()",
        description: "Get microtime (TCSPC) data as numpy array (nanoseconds)",
        example: `microtimes = get_microtimes()  # numpy.ndarray`,
      },
      {
        name: "get_abstimes()",
        description: "Get absolute arrival times as numpy array (nanoseconds)",
        example: `abstimes = get_abstimes()  # numpy.ndarray`,
      },
      {
        name: "get_data()",
        description: "Get all measurement data as a dictionary",
        example: `data = get_data()
# Keys: microtimes, abstimes, channel, metadata`,
      },
      {
        name: "set_output(id, value)",
        description:
          "Set an output value - ID must match Configuration tab exactly",
        example: `set_output("my_histogram", {"bins": [...], "counts": [...]})
set_output("count", 42)`,
      },
    ],
  },

  outputFormats: {
    title: "Output Formats by Type",
    description: "Each output type requires a specific data format:",
    formats: [
      {
        type: "histogram",
        required: "bins (list), counts (list)",
        optional: "title, xlabel, ylabel",
        example: `set_output("my_histogram", {
    "bins": [0.1, 0.2, 0.3],
    "counts": [10, 25, 15],
    "title": "My Histogram",
    "xlabel": "Time (ns)",
    "ylabel": "Counts"
})`,
      },
      {
        type: "plot",
        required: "x (list), y (list)",
        optional: "title, xlabel, ylabel, type ('line' or 'scatter')",
        example: `set_output("my_plot", {
    "x": [1, 2, 3, 4],
    "y": [10, 20, 15, 25],
    "title": "My Plot",
    "type": "line"
})`,
      },
      {
        type: "table",
        required: "columns (list of strings), rows (2D list)",
        optional: "title",
        example: `set_output("my_table", {
    "columns": ["Name", "Value"],
    "rows": [["Mean", 42.5], ["Std", 3.2]]
})`,
      },
      {
        type: "value",
        required: "number, string, or boolean",
        optional: "none",
        example: `set_output("photon_count", 12345)
set_output("status", "Complete")`,
      },
      {
        type: "heatmap",
        required: "values (2D list)",
        optional: "title, xlabel, ylabel, colorScale ('viridis' or 'plasma')",
        example: `set_output("my_heatmap", {
    "values": [[1, 2], [3, 4]],
    "colorScale": "viridis"
})`,
      },
      {
        type: "array",
        required: "1D list of numbers",
        optional: "none (can be chained to other plugins)",
        example: `set_output("filtered_data", values.tolist())`,
      },
      {
        type: "timeseries",
        required: "time (list), values (list)",
        optional: "timeUnit, valueUnit",
        example: `set_output("trace", {
    "time": times.tolist(),
    "values": intensities.tolist(),
    "timeUnit": "s"
})`,
      },
    ],
  },

  commonMistakes: {
    title: "Common Mistakes",
    mistakes: [
      {
        title: "Output ID Mismatch",
        wrong: `set_output("myHistogram", ...)`,
        right: `set_output("my_histogram", ...)`,
        explanation:
          "ID must exactly match Configuration tab (check capitalization and underscores)",
      },
      {
        title: "Forgot to Convert Numpy Arrays",
        wrong: `set_output("hist", {"bins": numpy_array})`,
        right: `set_output("hist", {"bins": numpy_array.tolist()})`,
        explanation:
          "Always use .tolist() to convert numpy arrays to Python lists",
      },
      {
        title: "No Empty Data Check",
        wrong: `mean = np.mean(microtimes)  # Crashes if empty`,
        right: `if len(microtimes) > 0:
    mean = np.mean(microtimes)`,
        explanation: "Always check if data exists before processing",
      },
      {
        title: "Using Forbidden Imports",
        wrong: `import os  # Not allowed`,
        right: `import numpy as np  # Allowed`,
        explanation:
          "Only numpy, scipy, pandas, matplotlib, h5py are available",
      },
    ],
  },

  packages: {
    title: "Available Packages",
    list: ["numpy (as np)", "scipy", "pandas", "matplotlib", "h5py"],
  },
};

export const SCRIPT_HELP_TEXT = SCRIPT_GUIDE_EXAMPLE;
