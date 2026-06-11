import React from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Users, Activity, AlertTriangle, Zap, Star, LogOut } from 'lucide-react'
import { supabase } from '../../lib/supabase'

const MENU_ITEMS = [
  { to: '/admin',         icon: LayoutDashboard, label: 'Overview' },
  { to: '/admin/users',   icon: Users,           label: 'Users' },
  { to: '/admin/api',     icon: Activity,        label: 'API Health' },
  { to: '/admin/errors',  icon: AlertTriangle,   label: 'Errors' },
  { to: '/admin/perf',    icon: Zap,             label: 'Performance' },
  { to: '/admin/usage',   icon: Star,            label: 'Feature Usage' },
]

export default function AdminSidebar() {
  const navigate = useNavigate()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  return (
    <aside className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col h-screen sticky top-0 shrink-0">
      <div className="p-4 border-b border-gray-800">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center text-white font-bold text-xs">V</div>
          <h2 className="font-bold text-white tracking-tight">Admin Dashboard</h2>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
          Live System
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {MENU_ITEMS.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/admin'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive 
                  ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20' 
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`
            }
          >
            <Icon size={16} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-800 space-y-2">
        <button 
          onClick={() => navigate('/')}
          className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
        >
          <LogOut size={16} />
          Back to Website
        </button>
        <button 
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
        >
          <LogOut size={16} />
          Logout
        </button>
      </div>
    </aside>
  )
}
