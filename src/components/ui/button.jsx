export function Button({ className = '', variant = 'default', size = 'md', children, onClick }) {
  const base = 'inline-flex items-center justify-center font-medium rounded-2xl transition-colors cursor-pointer'
  const variants = {
    default: 'bg-slate-900 text-white hover:bg-slate-700',
    outline: 'border border-slate-300 text-slate-700 bg-white hover:bg-slate-50',
    secondary: 'bg-slate-100 text-slate-900 hover:bg-slate-200',
  }
  const sizes = { sm: 'px-3 py-1.5 text-sm', md: 'px-4 py-2 text-sm' }
  return (
    <button onClick={onClick} className={`${base} ${variants[variant] || variants.default} ${sizes[size] || sizes.md} ${className}`}>
      {children}
    </button>
  )
}
