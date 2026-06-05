import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import Watchlist from './pages/Watchlist'
import StockDetail from './pages/StockDetail'
import DividendPage from './pages/DividendPage'
import GrowthStocks from './pages/GrowthStocks'
import HotMovers from './pages/HotMovers'
import StockHunter from './pages/StockHunter'
import './index.css'

function App() {
  return (
    <BrowserRouter basename="/vestly">
      <Routes>
        <Route path="/stock/:symbol" element={<StockDetail />} />
        <Route element={<Layout><Routes>
          <Route path="/"          element={<Home />} />
          <Route path="/watchlist" element={<Watchlist />} />
          <Route path="/dividends" element={<DividendPage />} />
          <Route path="/growth"    element={<GrowthStocks />} />
          <Route path="/movers"    element={<HotMovers />} />
          <Route path="/hunter"   element={<StockHunter />} />
        </Routes></Layout>}>
          <Route path="*" element={null} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode><App /></React.StrictMode>
)
