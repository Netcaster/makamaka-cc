export function Input({ className = '', ...props }) {
  return (
    <input
      className={`w-full border border-slate-300 rounded-2xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-400 bg-white ${className}`}
      {...props}
    />
  )
}
