export function Badge({ className = '', variant = 'default', children }) {
  const variants = {
    default: 'bg-slate-900 text-white',
    secondary: 'bg-teal-100 text-teal-800',
    outline: 'border border-slate-300 text-slate-600 bg-transparent',
  }
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 text-xs font-semibold rounded-full ${variants[variant] || variants.default} ${className}`}>
      {children}
    </span>
  )
}
