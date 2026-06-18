import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import Layout from './components/Layout'
import Home from './pages/Home'
import Watchlist from './pages/Watchlist'
import StockDetail from './pages/StockDetail'
import DividendPage from './pages/DividendPage'
import CalendarHub from './pages/CalendarHub'
import GrowthStocks from './pages/GrowthStocks'
import HotMovers from './pages/HotMovers'
import StockHunter from './pages/StockHunter'
import CookiePolicy from './pages/CookiePolicy'
import AdminLayout from './components/admin/AdminLayout'
import Dashboard from './pages/admin/Dashboard'
import Login from './pages/admin/Login'
import AuthRoute from './components/admin/AuthRoute'
import Auth from './pages/Auth'
import { AuthProvider } from './contexts/AuthContext'
import './index.css'

function AppRoutes() {
  const location = useLocation()
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/admin" element={<AuthRoute />}>
          <Route element={<AdminLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="users" element={<Dashboard />} />
            <Route path="api" element={<Dashboard />} />
            <Route path="errors" element={<Dashboard />} />
            <Route path="perf" element={<Dashboard />} />
            <Route path="usage" element={<Dashboard />} />
          </Route>
        </Route>
        <Route path="/login" element={<Login />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/stock/:symbol" element={<StockDetail />} />
        <Route path="/cookie-policy" element={<CookiePolicy />} />
        <Route element={<Layout><Routes>
          <Route path="/"          element={<Home />} />
          <Route path="/watchlist" element={<Watchlist />} />
          <Route path="/dividends" element={<DividendPage />} />
          <Route path="/calendar"  element={<CalendarHub />} />
          <Route path="/growth"    element={<GrowthStocks />} />
          <Route path="/movers"    element={<HotMovers />} />
          <Route path="/hunter"   element={<StockHunter />} />
        </Routes></Layout>}>
          <Route path="*" element={null} />
        </Route>
      </Routes>
    </AnimatePresence>
  )
}

function App() {
  return (
    <BrowserRouter basename="/vestly">
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode><App /></React.StrictMode>
)
