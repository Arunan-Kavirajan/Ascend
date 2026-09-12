export default function AnimatedCounter({ value, className = '' }: { value: number, duration?: number, className?: string }) {
  return <span className={className}>{value}</span>;
}
