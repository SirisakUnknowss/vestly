import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useState } from 'react'
import {
  Home, Star, DollarSign, TrendingUp, Flame,
  Target, Sun, Moon, Monitor, Search, Calendar,
  Calculator, LayoutGrid, Bot, BookOpen, SlidersHorizontal,
  Globe, UserCircle
} from 'lucide-react'
import { useTheme } from '../hooks/useTheme'
import { useAnalytics } from '../hooks/useAnalytics'
import { useVisitorCount } from '../hooks/useVisitorCount'
import FeedbackWidget from './FeedbackWidget'
import CookieConsent from './CookieConsent'
import GlobalSearch from './GlobalSearch'
import { useAuth } from '../contexts/AuthContext'
import logoUrl from '/logo.png'

const CATEGORIES = [
  {
    id: 'market',
    label: 'Market Hub',
    to: '/',
    sub: [
      { to: '/', label: 'Overview', icon: Home, exact: true },
      { to: '/watchlist', label: 'Watchlist', icon: Star }
    ]
  },
  {
    id: 'screener',
    label: 'Screener',
    to: '/stocks',
    sub: [
      { to: '/stocks', label: 'All Stocks', icon: Search },
      { to: '/screener', label: 'Advanced Screener', icon: SlidersHorizontal },
      { to: '/hunter', label: 'Stock Hunter', icon: Target },
      { to: '/dividends', label: 'Dividends', icon: DollarSign },
      { to: '/growth', label: 'Growth Stocks', icon: TrendingUp },
      { to: '/movers', label: 'Hot Movers', icon: Flame }
    ]
  },
  {
    id: 'tools',
    label: 'Tools',
    to: '/calendar',
    sub: [
      { to: '/calendar', label: 'Calendar Hub', icon: Calendar },
      { to: '/dca', label: 'DCA Calculator', icon: Calculator },
      { to: '/heatmap', label: 'Sector Heatmap', icon: LayoutGrid },
      { to: '/journal', label: 'Investment Journal', icon: BookOpen },
      { to: '/macro', label: 'Macro Dashboard', icon: Globe }
    ]
  },
  {
    id: 'ai',
    label: 'AI Chat',
    to: '/ai-assistant',
    sub: [
      { to: '/ai-assistant', label: 'AI Assistant', icon: Bot }
    ]
  }
]

const MOBILE_NAV = [
  { to: '/',             icon: Home,        label: 'Market Hub' },
  { to: '/watchlist',    icon: Star,        label: 'Watchlist'  },
  { to: '/stocks',       icon: Search,      label: 'Screener'   },
  { to: '/ai-assistant', icon: Bot,         label: 'AI Chat'    },
  { to: '/auth',         icon: UserCircle,  label: 'Profile'    },
]

const THEME_OPTIONS = [
  { id: 'light',  icon: Sun,     label: 'Light'  },
  { id: 'system', icon: Monitor, label: 'System' },
  { id: 'dark',   icon: Moon,    label: 'Dark'   },
]

export default function Layout({ children }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { theme, setTheme, resolved } = useTheme()
  const [themeMenuOpen, setThemeMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const visitorCount = useVisitorCount()
  const { user, profile, signOut } = useAuth()

  // Initialize analytics tracking
  useAnalytics()

  // Global Cmd+K / Ctrl+K listener
  import('react').then(({ useEffect }) => {
    useEffect(() => {
      const handleKeyDown = (e) => {
        if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
          e.preventDefault()
          setSearchOpen(true)
        }
      }
      window.addEventListener('keydown', handleKeyDown)
      return () => window.removeEventListener('keydown', handleKeyDown)
    }, [])
  })

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
            <img src={logoUrl} alt="Vestly" className="w-8 h-8 rounded-xl object-contain" />
            <span className="font-black text-lg tracking-tight gradient-text">Vestly</span>
          </button>

          {/* Nav — desktop */}
          <nav className="hidden md:flex items-center gap-0.5 ml-4">
            {CATEGORIES.map((cat) => {
              // Find if this category is active based on current location matching any sub path
              const isActive = cat.sub.some(s => {
                if (s.exact) return location.pathname === s.to
                return location.pathname === s.to || (s.to !== '/' && location.pathname.startsWith(s.to))
              })
              return (
                <NavLink
                  key={cat.id}
                  to={cat.to}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                    isActive
                      ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 shadow-sm shadow-emerald-500/5'
                      : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
                  }`}
                >
                  {cat.label}
                </NavLink>
              )
            })}
          </nav>

          <div className="flex-1" />

          {/* Search Button */}
          <button 
            onClick={() => setSearchOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800/50 hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-colors border border-transparent dark:border-gray-700/50"
          >
            <Search size={16} />
            <span className="hidden sm:inline text-sm">ค้นหาหุ้น...</span>
            <kbd className="hidden md:inline-flex items-center gap-1 font-sans text-[10px] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded px-1.5 py-0.5 ml-2">
              <span className="text-xs leading-none">⌘</span>K
            </kbd>
          </button>

          {/* User Menu */}
          <div className="relative ml-2">
            {user ? (
              <>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
                >
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt="Avatar" className="w-8 h-8 rounded-full border border-gray-300 dark:border-gray-700" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
                      {profile?.full_name?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                  )}
                </button>
                {userMenuOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setUserMenuOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-xl z-50 overflow-hidden">
                      <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{profile?.full_name || 'User'}</p>
                        <p className="text-xs text-gray-500 truncate">{user.email}</p>
                      </div>
                      <div className="py-1">
                        <button
                          onClick={() => {
                            signOut()
                            setUserMenuOpen(false)
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                        >
                          Sign out
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </>
            ) : (
              <button
                onClick={() => navigate('/auth')}
                className="flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors"
              >
                Sign In
              </button>
            )}
          </div>

        </div>

        {/* ── Mobile bottom nav ── */}
        <div className="md:hidden flex border-t" style={{ borderColor: 'var(--border)' }}>
          {MOBILE_NAV.map(({ to, icon: Icon, label }) => {
            const isExact = to === '/'
            const isProfile = to === '/auth'
            const profileTo = isProfile && user ? '/profile' : to
            return (
              <NavLink
                key={to}
                to={profileTo}
                end={isExact}
                className={({ isActive }) =>
                  `flex-1 flex flex-col items-center py-2 gap-0.5 text-[10px] font-semibold transition-colors ${
                    isActive ? 'text-emerald-400' : 'text-gray-600'
                  }`
                }
              >
                {isProfile && user ? (
                  profile?.avatar_url
                    ? <img src={profile.avatar_url} alt="Avatar" className="w-[17px] h-[17px] rounded-full object-cover" />
                    : <div className="w-[17px] h-[17px] rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-[9px]">
                        {profile?.full_name?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || 'U'}
                      </div>
                ) : (
                  <Icon size={17} />
                )}
                {isProfile ? (user ? 'Profile' : 'Sign In') : label}
              </NavLink>
            )
          })}
        </div>
      </header>

      {/* Compute active category and showSidebar state */}
      {(() => {
        const activeCategory = CATEGORIES.find(cat => 
          cat.sub.some(s => {
            if (s.exact) return location.pathname === s.to
            return location.pathname === s.to || (s.to !== '/' && location.pathname.startsWith(s.to))
          })
        ) || CATEGORIES[0]

        const showSidebar = activeCategory && activeCategory.sub.length > 1

        return (
          <>
            {/* ── Sub-menu tab bar for mobile ── */}
            {showSidebar && (
              <div 
                className="md:hidden flex items-center gap-1.5 overflow-x-auto px-4 py-2 border-b no-scrollbar scroll-smooth shrink-0"
                style={{ 
                  backgroundColor: resolved === 'dark' ? 'rgba(9,20,19,0.4)' : 'rgba(240,242,246,0.6)',
                  borderColor: 'var(--border)'
                }}
              >
                {activeCategory.sub.map(({ to, label, icon: Icon, exact }) => (
                  <NavLink
                    key={to}
                    to={to}
                    end={exact}
                    className={({ isActive }) =>
                      `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition-all ${
                        isActive
                          ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/30'
                          : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
                      }`
                    }
                  >
                    <Icon size={12} />
                    {label}
                  </NavLink>
                ))}
              </div>
            )}

            {/* ── Main Layout Wrapper (Sidebar + Page content) ── */}
            <div className="flex-1 w-full max-w-screen-xl mx-auto px-4 py-6 flex flex-col md:flex-row gap-6">
              
              {/* Sidebar - Desktop */}
              {showSidebar && (
                <aside className="w-60 shrink-0 hidden md:block sticky top-20 self-start p-4 rounded-2xl border"
                  style={{ 
                    backgroundColor: 'var(--bg-card)', 
                    borderColor: 'var(--border)',
                    boxShadow: '0 4px 20px var(--shadow)',
                  }}>
                  <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3.5 px-2.5">
                    {activeCategory.label}
                  </h3>
                  <nav className="space-y-1">
                    {activeCategory.sub.map(({ to, label, icon: Icon, exact }) => (
                      <NavLink
                        key={to}
                        to={to}
                        end={exact}
                        className={({ isActive }) =>
                          `flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-semibold transition-all ${
                            isActive
                              ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 font-bold'
                              : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
                          }`
                        }
                      >
                        <Icon size={15} />
                        {label}
                      </NavLink>
                    ))}
                  </nav>
                </aside>
              )}

              {/* Main Content */}
              <main className="flex-1 min-w-0">
                {children}
              </main>
            </div>
          </>
        )
      })()}

      {/* ── Footer ── */}
      <footer className="border-t py-4 text-center" style={{ borderColor: 'var(--border)' }}>
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          <span className="gradient-text font-bold">Vestly</span>
          {' '}· Invest Smarter, Start Earlier · ข้อมูลเพื่อการศึกษาเท่านั้น ไม่ใช่คำแนะนำการลงทุน
        </p>
        {visitorCount !== null && (
          <p className="text-xs mt-1.5 flex items-center justify-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
            <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', backgroundColor: '#408A71' }} />
            ผู้เยี่ยมชมทั้งหมด{' '}
            <span className="font-semibold" style={{ color: 'var(--accent-text)' }}>
              {visitorCount.toLocaleString()}
            </span>
            {' '}ครั้ง
          </p>
        )}
      </footer>

      {/* ── Feedback Widget ── */}
      <FeedbackWidget />

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

      <GlobalSearch isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
      <CookieConsent />
    </div>
  )
}
