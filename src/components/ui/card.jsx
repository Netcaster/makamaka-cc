export function Card({ className = '', children, style }) {
  return <div className={`bg-white border border-slate-200 rounded-2xl shadow-sm ${className}`} style={style}>{children}</div>
}
export function CardContent({ className = '', children }) {
  return <div className={`p-5 ${className}`}>{children}</div>
}
