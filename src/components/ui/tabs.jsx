import { createContext, useContext, useState } from 'react'

const TabsCtx = createContext({})

export function Tabs({ defaultValue, className = '', children }) {
  const [active, setActive] = useState(defaultValue)
  return (
    <TabsCtx.Provider value={{ active, setActive }}>
      <div className={className}>{children}</div>
    </TabsCtx.Provider>
  )
}

export function TabsList({ className = '', children }) {
  return <div className={`flex flex-wrap gap-1 ${className}`}>{children}</div>
}

export function TabsTrigger({ value, className = '', children }) {
  const { active, setActive } = useContext(TabsCtx)
  const isActive = active === value
  return (
    <button
      onClick={() => setActive(value)}
      className={`px-4 py-2 text-sm font-medium rounded-xl transition-colors cursor-pointer ${
        isActive ? 'bg-teal-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
      } ${className}`}
    >
      {children}
    </button>
  )
}

export function TabsContent({ value, className = '', children }) {
  const { active } = useContext(TabsCtx)
  if (active !== value) return null
  return <div className={className}>{children}</div>
}
