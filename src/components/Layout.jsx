import { NavLink, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import {
  Home, Star, DollarSign, TrendingUp, Flame,
  Target, Sun, Moon, Monitor
} from 'lucide-react'
import { useTheme } from '../hooks/useTheme'

const NAV = [
  { to: '/',          icon: Home,        label: 'Markets'    },
  { to: '/watchlist', icon: Star,        label: 'Watchlist'  },
  { to: '/dividends', icon: DollarSign,  label: 'Dividends'  },
  { to: '/growth',    icon: TrendingUp,  label: 'Growth'     },
  { to: '/movers',    icon: Flame,       label: 'Hot'        },
  { to: '/hunter',    icon: Target,      label: 'Hunter'     },
]

const THEME_OPTIONS = [
  { id: 'light',  icon: Sun,     label: 'Light'  },
  { id: 'system', icon: Monitor, label: 'System' },
  { id: 'dark',   icon: Moon,    label: 'Dark'   },
]

export default function Layout({ children }) {
  const navigate = useNavigate()
  const { theme, setTheme, resolved } = useTheme()
  const [themeMenuOpen, setThemeMenuOpen] = useState(false)

  const currentIcon = THEME_OPTIONS.find(o => o.id === theme)?.icon ?? Monitor

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--bg-base)' }}>

      {/* ── Top Bar ── */}
      <header className="sticky top-0 z-30 border-b"
        style={{
          backgroundColor: resolved === 'dark' ? 'rgba(9,20,19,0.92)' : 'rgba(240,242,246,0.95)',
          backdropFilter: 'blur(20px)',
          borderColor: 'var(--border)',
          boxShadow: '0 1px 0 var(--border-subtle)',
        }}>
        <div className="max-w-screen-xl mx-auto px-4 h-14 flex items-center gap-4">

          {/* Logo */}
          <button onClick={() => navigate('/')} className="flex items-center gap-2 shrink-0">
            <img src="/logo.png" alt="Vestly" className="w-8 h-8 rounded-xl object-contain" />
            <span className="font-black text-lg tracking-tight gradient-text">Vestly</span>
          </button>

          {/* Nav — desktop */}
          <nav className="hidden md:flex items-center gap-0.5 ml-2">
            {NAV.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'text-white bg-emerald-500/10 border border-emerald-500/30'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`
                }
              >
                <Icon size={14} />
                {label}
              </NavLink>
            ))}
          </nav>

          <div className="flex-1" />
        </div>

        {/* ── Mobile bottom nav ── */}
        <div className="md:hidden flex border-t" style={{ borderColor: 'var(--border)' }}>
          {NAV.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex-1 flex flex-col items-center py-2 gap-0.5 text-[10px] font-medium transition-colors ${
                  isActive ? 'text-emerald-400' : 'text-gray-600'
                }`
              }
            >
              <Icon size={17} />
              {label}
            </NavLink>
          ))}
        </div>
      </header>

      {/* ── Page ── */}
      <main className="flex-1">{children}</main>

      {/* ── Footer ── */}
      <footer className="border-t py-4 text-center" style={{ borderColor: 'var(--border)' }}>
        <p className="text-xs text-gray-600">
          <span className="gradient-text font-bold">Vestly</span>
          {' '}· Invest Smarter, Start Earlier · ข้อมูลเพื่อการศึกษาเท่านั้น ไม่ใช่คำแนะนำการลงทุน
        </p>
      </footer>

      {/* ── Floating Theme Toggle ── */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
        {themeMenuOpen && (
          <div className="flex flex-col gap-1 p-1.5 rounded-xl shadow-xl"
            style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            {THEME_OPTIONS.map(({ id, icon: Icon, label }) => (
              <button
                key={id}
                onClick={() => { setTheme(id); setThemeMenuOpen(false) }}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  theme === id
                    ? 'text-emerald-400'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
                style={theme === id ? { backgroundColor: 'var(--bg-elevated)' } : {}}
              >
                <Icon size={14} />
                {label}
              </button>
            ))}
          </div>
        )}

        <button
          onClick={() => setThemeMenuOpen(o => !o)}
          className="w-11 h-11 rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-105 active:scale-95"
          style={{
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border)',
            boxShadow: '0 4px 20px var(--shadow)',
            color: 'var(--text-secondary)',
          }}
        >
          {(() => { const I = currentIcon; return <I size={16} /> })()}
        </button>
      </div>

      {/* backdrop to close menu */}
      {themeMenuOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setThemeMenuOpen(false)} />
      )}
    </div>
  )
}
