/**
 * FormatBadge.tsx
 *
 * Simple badge component to display file format
 */

interface FormatBadgeProps {
  format: string;
  className?: string;
}

const FORMAT_COLORS: Record<string, string> = {
  'hdf5_custom': 'bg-blue-100 text-blue-700',
  'photon_hdf5': 'bg-indigo-100 text-indigo-700',
  'picoquant_ptu': 'bg-green-100 text-green-700',
  'picoquant_pt3': 'bg-green-100 text-green-700',
  'picoquant_pt2': 'bg-green-100 text-green-700',
  'picoquant_ht3': 'bg-green-100 text-green-700',
  'picoquant_t3r': 'bg-green-100 text-green-700',
  'bh_sdt': 'bg-purple-100 text-purple-700',
  'bh_spc': 'bg-purple-100 text-purple-700',
  'csv': 'bg-gray-100 text-gray-700',
};

const FORMAT_LABELS: Record<string, string> = {
  'hdf5_custom': 'HDF5',
  'photon_hdf5': 'Photon-HDF5',
  'picoquant_ptu': 'PicoQuant',
  'picoquant_pt3': 'PicoQuant',
  'picoquant_pt2': 'PicoQuant',
  'picoquant_ht3': 'PicoQuant',
  'picoquant_t3r': 'PicoQuant',
  'bh_sdt': 'Becker & Hickl',
  'bh_spc': 'Becker & Hickl',
  'csv': 'CSV',
};

export default function FormatBadge({ format, className = '' }: FormatBadgeProps) {
  const colors = FORMAT_COLORS[format] || 'bg-gray-100 text-gray-700';
  const label = FORMAT_LABELS[format] || format;

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${colors} ${className}`}>
      {label}
    </span>
  );
}
