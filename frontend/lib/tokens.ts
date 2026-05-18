// Use these when you need raw values in JS — e.g. Chart.js, D3, canvas.
// For everything else, use Tailwind classes.

export const colors = {
  primary:     '#00e5ff',
  background:  '#121212',
  card:        '#1E1E1E',
  foreground:  '#e8e8e8',
  success:     '#00e676',
  warning:     '#ffd600',
  destructive: '#ff1744',
  border:      '#3a3a3a',
  chart: ['#440154', '#31688e', '#35b779', '#fde724', '#21918c'] as const,
} as const
