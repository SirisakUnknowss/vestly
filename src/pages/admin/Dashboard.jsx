import React, { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import PageTransition from '../../components/PageTransition'
import { 
  Users, Activity, AlertTriangle, Zap, 
  CheckCircle, Clock, Server, ArrowUpRight, ArrowDownRight, BarChart2,
  ShieldCheck, Star
} from 'lucide-react'
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'

// --- MOCK DATA FOR OTHER CHARTS ---
const userTrendData = [
  { time: '00:00', users: 120 }, { time: '04:00', users: 80 },
  { time: '08:00', users: 250 }, { time: '12:00', users: 400 },
  { time: '16:00', users: 380 }, { time: '20:00', users: 550 },
  { time: '24:00', users: 410 },
]

const apiErrorTrend = [
  { time: '10:00', errors: 2 }, { time: '11:00', errors: 5 },
  { time: '12:00', errors: 1 }, { time: '13:00', errors: 12 },
  { time: '14:00', errors: 3 }, { time: '15:00', errors: 0 },
]

const cacheHitMiss = [
  { name: 'HIT', value: 78, color: '#3b82f6' },
  { name: 'MISS', value: 22, color: '#374151' },
]

const featureUsage = [
  { name: 'Watchlist view', usage: 94 },
  { name: 'Stock detail chart', usage: 82 },
  { name: 'Dividend screener', usage: 51 },
  { name: 'Top Movers button', usage: 38 },
  { name: 'Search & Add stock', usage: 24 },
  { name: 'Star/Favorites', usage: 13 },
]

const errorLogs = [
  { id: 1, time: '23:04:12', type: 'API_FETCH_FAIL', msg: 'Finnhub 429 Too Many Reqs', page: '/stock/TSLA', cnt: 5, status: 'Open' },
  { id: 2, time: '22:51:33', type: 'WS_DISCONNECT', msg: 'WebSocket closed (code 1006)', page: '/', cnt: 2, status: 'Watch' },
  { id: 3, time: '21:00:07', type: 'JS_ERROR', msg: 'Cannot read prop of null', page: '/dividends', cnt: 1, status: 'Fixed' },
]

// --- COMPONENTS ---
const Card = ({ children, className = '' }) => (
  <div className={`bg-gray-900 border border-gray-800 rounded-xl p-5 ${className}`}>
    {children}
  </div>
)

const KPICard = ({ title, value, icon: Icon, trend, isGood, subtitle }) => (
  <Card>
    <div className="flex justify-between items-start mb-2">
      <div className="text-gray-400 font-medium text-sm">{title}</div>
      <div className={`p-2 rounded-lg ${isGood ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
        <Icon size={18} />
      </div>
    </div>
    <div className="text-3xl font-bold text-white mb-2">{value}</div>
    <div className="flex items-center gap-2 text-sm">
      {trend && (
        <span className={`flex items-center gap-0.5 ${trend > 0 ? (isGood ? 'text-green-400' : 'text-red-400') : (isGood ? 'text-green-400' : 'text-green-400')}`}>
          {trend > 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
          {Math.abs(trend)}%
        </span>
      )}
      <span className="text-gray-500">{subtitle}</span>
    </div>
  </Card>
)

export default function Dashboard() {
  const location = useLocation()
  
  const [activeUsers, setActiveUsers] = useState(0)
  const [registeredUsers, setRegisteredUsers] = useState(0)
  const [pageViewData, setPageViewData] = useState([])
  const [topStocks, setTopStocks] = useState([])
  const [mostStarred, setMostStarred] = useState([])
  const [cookieConsentData, setCookieConsentData] = useState({ accepted: 0, rejected: 0 })
  const [isLoading, setIsLoading] = useState(true)
  
  useEffect(() => {
    async function fetchData() {
      try {
        // 1. Get Live Active Users (seen in last 5 mins)
        const fiveMinsAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()
        const { count } = await supabase
          .from('active_sessions')
          .select('*', { count: 'exact', head: true })
          .gte('last_seen', fiveMinsAgo)
        
        if (count !== null) setActiveUsers(count)

        // 2. Get Page Views (Aggregate on client for simplicity)
        const { data: views } = await supabase.from('page_views').select('path').limit(1000)
        
        if (views) {
          const counts = views.reduce((acc, v) => {
            const name = v.path === '/vestly' || v.path === '/' || v.path === '' ? 'Markets' : v.path.replace('/vestly/', '').split('/')[0] || 'Home'
            const cleanName = name.charAt(0).toUpperCase() + name.slice(1)
            acc[cleanName] = (acc[cleanName] || 0) + 1
            return acc
          }, {})
          
          setPageViewData(
            Object.entries(counts)
              .map(([name, views]) => ({ name, views }))
              .sort((a, b) => b.views - a.views)
              .slice(0, 5)
          )
        }

        // 3. Get Top Viewed Stocks
        const { data: stocks } = await supabase.from('stock_views').select('symbol').limit(1000)
        if (stocks) {
          const stockCounts = stocks.reduce((acc, v) => {
            acc[v.symbol] = (acc[v.symbol] || 0) + 1
            return acc
          }, {})
          
          setTopStocks(
            Object.entries(stockCounts)
              .map(([symbol, views], idx) => ({
                rank: 0,
                symbol,
                name: 'Data from Supabase',
                views,
                time: '-'
              }))
              .sort((a, b) => b.views - a.views)
              .slice(0, 5)
              .map((s, i) => ({ ...s, rank: i + 1 }))
          )
        }

        // 4. Get Cookie Consents
        const { data: consents } = await supabase.from('cookie_consents').select('choice')
        if (consents) {
          const acc = consents.filter(c => c.choice === 'accepted').length
          const rej = consents.filter(c => c.choice === 'rejected').length
          setCookieConsentData({ accepted: acc, rejected: rej })
        }

        // 5. Get Registered Users Count
        const { count: regCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true })
        if (regCount !== null) setRegisteredUsers(regCount)

        // 6. Get Most Starred Stocks
        const { data: starred } = await supabase.from('user_watchlists').select('symbol').limit(2000)
        if (starred) {
          const starCounts = starred.reduce((acc, v) => {
            acc[v.symbol] = (acc[v.symbol] || 0) + 1
            return acc
          }, {})
          
          setMostStarred(
            Object.entries(starCounts)
              .map(([symbol, count], idx) => ({
                rank: 0,
                symbol,
                name: 'Cloud Watchlist',
                count,
              }))
              .sort((a, b) => b.count - a.count)
              .slice(0, 5)
              .map((s, i) => ({ ...s, rank: i + 1 }))
          )
        }
      } catch (e) {
        console.error("Failed to fetch analytics:", e)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
    // Poll every 10 seconds for real-time updates
    const interval = setInterval(fetchData, 10000)
    return () => clearInterval(interval)
  }, [])

  const path = location.pathname

  // Helpers to check which sections to show
  const isOverview = path === '/admin' || path === '/admin/'
  const showUsers = isOverview || path === '/admin/users'
  const showApi = isOverview || path === '/admin/api'
  const showErrors = isOverview || path === '/admin/errors'
  const showPerf = isOverview || path === '/admin/perf'
  const showUsage = isOverview || path === '/admin/usage'

  // Dynamic titles
  const pageTitle = {
    '/admin': 'Overview',
    '/admin/users': 'User Analytics',
    '/admin/api': 'API Health',
    '/admin/errors': 'System Errors',
    '/admin/perf': 'Performance',
    '/admin/usage': 'Feature Usage',
  }[path] || 'Dashboard'

  return (
    <PageTransition className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">{pageTitle}</h1>
          <p className="text-sm text-gray-400 mt-1">
            {isOverview ? 'Real-time system metrics and user analytics.' : `Detailed view for ${pageTitle.toLowerCase()}.`}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 px-4 py-2 rounded-lg">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500"></span>
            </span>
            <span className="text-sm font-bold text-blue-400">Live Users: {activeUsers}</span>
          </div>
          <div className="flex items-center gap-2 text-xs font-medium px-3 py-1.5 bg-gray-800 rounded-lg text-gray-300">
            <Clock size={14} />
            Last updated: Just now
          </div>
        </div>
      </div>

      {/* 1. KPI Cards Row */}
      {(isOverview || showUsers || showPerf || showErrors) && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {(isOverview || showUsers) && <KPICard title="Active Live Users" value={isLoading ? '...' : activeUsers.toString()} icon={Activity} trend={0} isGood={true} subtitle="Last 5 minutes" />}
          {(isOverview || showUsers) && <KPICard title="Total Members" value={isLoading ? '...' : registeredUsers.toString()} icon={Users} trend={0} isGood={true} subtitle="Registered profiles" />}
          {(isOverview || showApi) && <KPICard title="API Calls" value="1,430/hr" icon={Server} subtitle="76% of limit" isGood={true} />}
          {(isOverview || showErrors) && <KPICard title="Errors" value="3" icon={AlertTriangle} trend={-2} isGood={true} subtitle="vs ytd" />}
        </div>
      )}

      {/* 2. Main Charts Row */}
      {showUsers && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <Card className="lg:col-span-2">
          <h3 className="font-semibold text-white mb-4">Active Users (Last 24h)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={userTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                <XAxis dataKey="time" stroke="#9ca3af" fontSize={12} tickLine={false} />
                <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }} />
                <Line type="monotone" dataKey="users" stroke="#3b82f6" strokeWidth={3} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
        
        <Card>
          <h3 className="font-semibold text-white mb-4">Page Views Breakdown</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={pageViewData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" horizontal={false} />
                <XAxis type="number" stroke="#9ca3af" fontSize={12} hide />
                <YAxis dataKey="name" type="category" stroke="#9ca3af" fontSize={12} width={80} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }} cursor={{ fill: '#374151' }} />
                <Bar dataKey="views" fill="#10b981" radius={[0, 4, 4, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Cookie Consents */}
        <Card>
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
            <ShieldCheck size={18} className="text-emerald-400" /> Cookie Consents
          </h3>
          <div className="h-64 flex flex-col justify-center">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-sm">Accepted</span>
              <span className="text-white font-bold">{cookieConsentData.accepted}</span>
            </div>
            <div className="w-full bg-gray-800 rounded-full h-3 mb-6 overflow-hidden">
              <div 
                className="bg-emerald-500 h-3 rounded-full transition-all duration-1000" 
                style={{ width: `${cookieConsentData.accepted + cookieConsentData.rejected > 0 ? (cookieConsentData.accepted / (cookieConsentData.accepted + cookieConsentData.rejected)) * 100 : 0}%` }}
              ></div>
            </div>

            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-sm">Rejected</span>
              <span className="text-white font-bold">{cookieConsentData.rejected}</span>
            </div>
            <div className="w-full bg-gray-800 rounded-full h-3 overflow-hidden">
              <div 
                className="bg-red-500 h-3 rounded-full transition-all duration-1000" 
                style={{ width: `${cookieConsentData.accepted + cookieConsentData.rejected > 0 ? (cookieConsentData.rejected / (cookieConsentData.accepted + cookieConsentData.rejected)) * 100 : 0}%` }}
              ></div>
            </div>
            <div className="mt-8 text-center text-xs text-gray-500">
              Total Responses: {cookieConsentData.accepted + cookieConsentData.rejected}
            </div>
          </div>
        </Card>
      </div>
      )}

      {/* 3. API Health */}
      {showApi && (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-semibold text-white flex items-center gap-2">
              <Server size={18} className="text-blue-400" /> Finnhub API
            </h3>
            <span className="flex items-center gap-1.5 text-xs font-bold text-green-400 bg-green-400/10 px-2 py-1 rounded-full">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" /> UP
            </span>
          </div>
          <div className="space-y-5">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-400">WebSocket</span>
                <span className="text-white font-medium">Connected (127 symbols)</span>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-400">REST calls (42/60 per min)</span>
                <span className="text-white font-medium">70%</span>
              </div>
              <div className="h-2 w-full bg-gray-800 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: '70%' }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Latency</span>
                <span className="text-white font-medium">avg 89ms <span className="text-gray-500 text-xs ml-1">[P95: 210ms]</span></span>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-semibold text-white flex items-center gap-2">
              <Server size={18} className="text-purple-400" /> Twelve Data API
            </h3>
            <span className="flex items-center gap-1.5 text-xs font-bold text-green-400 bg-green-400/10 px-2 py-1 rounded-full">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" /> UP
            </span>
          </div>
          <div className="space-y-5">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-400">Daily quota (800/8000)</span>
                <span className="text-white font-medium">10%</span>
              </div>
              <div className="h-2 w-full bg-gray-800 rounded-full overflow-hidden">
                <div className="h-full bg-purple-500 rounded-full" style={{ width: '10%' }} />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={cacheHitMiss} dataKey="value" cx="50%" cy="50%" innerRadius={20} outerRadius={30} stroke="none">
                      {cacheHitMiss.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-400">Cache hit rate</span>
                  <span className="text-white font-medium">78%</span>
                </div>
                <div className="text-xs text-gray-500">div_metrics_v2</div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Latency</span>
                <span className="text-white font-medium">avg 340ms</span>
              </div>
            </div>
          </div>
        </Card>
      </div>
      )}

      {/* 4. Feature Usage & Performance */}
      {(showUsage || showPerf || (!isOverview && showUsers)) && (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {showUsage && (
        <Card className={!showPerf && !showUsers && !isOverview ? 'lg:col-span-2' : ''}>
          <h3 className="font-semibold text-white mb-4">Feature Usage Heatmap</h3>
          <div className="space-y-4">
            {featureUsage.map(f => (
              <div key={f.name}>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="text-gray-300">{f.name}</span>
                  <span className="text-gray-400">{f.usage}%</span>
                </div>
                <div className="h-1.5 w-full bg-gray-800 rounded-full overflow-hidden">
                  <div className="h-full bg-teal-500 rounded-full opacity-80" style={{ width: `${f.usage}%` }} />
                </div>
              </div>
            ))}
          </div>
        </Card>
        )}

        {(showPerf || (!isOverview && showUsers)) && (
        <Card className={!showUsage && !isOverview ? 'lg:col-span-2' : ''}>
          {showPerf && (
            <>
              <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                <CheckCircle size={18} className="text-green-500" /> Core Web Vitals
              </h3>
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="p-3 bg-gray-800 rounded-lg text-center border border-gray-700">
                  <div className="text-xs text-gray-400 mb-1">LCP</div>
                  <div className="text-xl font-bold text-green-400">1.8s</div>
                  <div className="text-[10px] text-gray-500 mt-1">Good (&lt;2.5s)</div>
                </div>
                <div className="p-3 bg-gray-800 rounded-lg text-center border border-gray-700">
                  <div className="text-xs text-gray-400 mb-1">INP</div>
                  <div className="text-xl font-bold text-green-400">45ms</div>
                  <div className="text-[10px] text-gray-500 mt-1">Good (&lt;200ms)</div>
                </div>
                <div className="p-3 bg-gray-800 rounded-lg text-center border border-gray-700">
                  <div className="text-xs text-gray-400 mb-1">CLS</div>
                  <div className="text-xl font-bold text-green-400">0.03</div>
                  <div className="text-[10px] text-gray-500 mt-1">Good (&lt;0.1)</div>
                </div>
              </div>
            </>
          )}
          
          {(showUsers || isOverview) && (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium text-gray-400 mb-3">Top Viewed Stocks</h4>
                <div className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700 text-sm">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-gray-700/50 text-gray-400 text-xs uppercase tracking-wider">
                        <th className="p-3 font-medium">Symbol</th>
                        <th className="p-3 font-medium">Views</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700/50">
                      {topStocks.length > 0 ? topStocks.map(s => (
                        <tr key={s.symbol} className="hover:bg-gray-700/30 transition-colors">
                          <td className="p-3">
                            <span className="font-bold text-white block">{s.symbol}</span>
                          </td>
                          <td className="p-3 text-gray-300">{s.views}</td>
                        </tr>
                      )) : (
                        <tr>
                          <td colSpan="2" className="p-4 text-center text-gray-500 text-xs">
                            No data available.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2">
                  <Star size={14} className="text-yellow-400" fill="currentColor" /> Most Starred Stocks
                </h4>
                <div className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700 text-sm">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-gray-700/50 text-gray-400 text-xs uppercase tracking-wider">
                        <th className="p-3 font-medium">Symbol</th>
                        <th className="p-3 font-medium">Stars</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700/50">
                      {mostStarred.length > 0 ? mostStarred.map(s => (
                        <tr key={s.symbol} className="hover:bg-gray-700/30 transition-colors">
                          <td className="p-3">
                            <span className="font-bold text-white block">{s.symbol}</span>
                          </td>
                          <td className="p-3 text-yellow-400 font-medium">{s.count}</td>
                        </tr>
                      )) : (
                        <tr>
                          <td colSpan="2" className="p-4 text-center text-gray-500 text-xs">
                            No data available.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </Card>
        )}
      </div>
      )}

      {/* 5. Error Log */}
      {showErrors && (
      <Card>
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-white">Recent Errors</h3>
          <div className="flex gap-2">
            <button className="px-3 py-1 bg-gray-800 hover:bg-gray-700 rounded text-xs font-medium text-white transition-colors">All</button>
            <button className="px-3 py-1 bg-gray-800 hover:bg-gray-700 rounded text-xs font-medium text-red-400 transition-colors">Critical</button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead>
              <tr className="text-gray-400 border-b border-gray-800">
                <th className="pb-3 font-medium">Time</th>
                <th className="pb-3 font-medium">Type</th>
                <th className="pb-3 font-medium">Message</th>
                <th className="pb-3 font-medium">Page</th>
                <th className="pb-3 font-medium">Cnt</th>
                <th className="pb-3 font-medium text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {errorLogs.map(err => (
                <tr key={err.id} className="hover:bg-gray-800/50 transition-colors">
                  <td className="py-3 text-gray-500">{err.time}</td>
                  <td className="py-3 font-medium text-gray-300">{err.type}</td>
                  <td className="py-3 text-gray-400">{err.msg}</td>
                  <td className="py-3 text-blue-400 font-mono text-xs">{err.page}</td>
                  <td className="py-3 text-gray-300">{err.cnt}</td>
                  <td className="py-3 text-right">
                    <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium ${
                      err.status === 'Open' ? 'bg-red-500/10 text-red-500' :
                      err.status === 'Watch' ? 'bg-yellow-500/10 text-yellow-500' :
                      'bg-green-500/10 text-green-500'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        err.status === 'Open' ? 'bg-red-500' : err.status === 'Watch' ? 'bg-yellow-500' : 'bg-green-500'
                      }`} />
                      {err.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      )}
      
    </PageTransition>
  )
}
