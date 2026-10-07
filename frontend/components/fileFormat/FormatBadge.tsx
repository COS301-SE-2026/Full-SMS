/**
 * FormatBadge.tsx
 *
 * Simple badge component to display file format
 */

interface FormatBadgeProps {
  name: string;
  className?: string;
}

const FORMAT_COLORS: Record<string, string> = {
  '.h5': 'bg-blue-100 text-blue-700',
  '.ptu': 'bg-green-100 text-green-700',
  '.phu': 'bg-green-100 text-green-700',
  '.sdt': 'bg-purple-100 text-purple-700',
  '.spc': 'bg-purple-100 text-purple-700',
  '.csv': 'bg-gray-100 text-gray-700',
};

const FORMAT_LABELS: Record<string, string> = {
  '.h5': 'HDF5',
  '.ptu': 'PicoQuant',
  '.phu': 'PicoQuant',
  'sdt': 'Becker & Hickl',
  '.spc': 'Becker & Hickl',
  '.csv': 'CSV',
};

export default function FormatBadge({ name, className = '' }: FormatBadgeProps) {

  const index = name.indexOf('.');
  const extension = index !== -1 ? name.substring(index) : "";

  const colors = FORMAT_COLORS[extension] || 'bg-gray-100 text-gray-700';
  const label = FORMAT_LABELS[extension];

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${colors} ${className}`}>
      {label}
    </span>
  );
}
