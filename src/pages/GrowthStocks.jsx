import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { TrendingUp, Rocket } from 'lucide-react'
import { STOCKS_DB } from '../data/stocksDB'

// Fast-growing companies — curated list with known growth profiles
const GROWTH_SYMBOLS = [
  'NVDA','META','AAPL','MSFT','GOOGL','AMZN','TSLA','AVGO','PLTR','APP',
  'ARM','SMCI','CRWD','PANW','NET','DDOG','SNOW','MDB','AXON','NOW',
  'SHOP','CELH','MNST','FICO','DECK','ONON','MSTR','ANET','WDAY','VEEV',
  'COIN','HOOD','AFRM','DASH','ABNB','BKNG','UBER','LLY','ISRG','EW',
  'VRTX','REGN','BSX','SYK','TMO','DHR','ORCL','CDNS','SNPS','ADBE',
  'CRM','INTU','ADP','PAYX','SPGI','MCO','V','MA','CBOE','ICE',
  'CME','GWW','FAST','ORLY','AZO','URI','POOL','CMG','YUM','MCD',
  'CEG','VST','FSLR','ENPH','XOM','CVX','COP','FANG','EOG',
]

const GROWTH_TAGS = {
  NVDA:'AI Chips', META:'AI/Social', PLTR:'AI Data', APP:'AI Ads', ARM:'Chip IP',
  CRWD:'Cybersecurity', PANW:'Cybersecurity', NET:'Cloud', DDOG:'Observability',
  SNOW:'Data Cloud', MDB:'Database', AXON:'Defense Tech', SMCI:'AI Servers',
  CELH:'Energy Drinks', ONON:'Premium Footwear', MSTR:'Bitcoin', COIN:'Crypto',
  LLY:'GLP-1 Drugs', ISRG:'Robotic Surgery', VRTX:'CFTR Drugs',
  FICO:'Credit Scoring', DECK:'Premium Footwear', CEG:'Nuclear', VST:'Power',
}

export default function GrowthStocks() {
  const navigate = useNavigate()
  const stocks = useMemo(() =>
    GROWTH_SYMBOLS.map(s => STOCKS_DB.find(d => d.s === s)).filter(Boolean)
  , [])

  return (
    <div className="max-w-screen-xl mx-auto px-4 py-6">
      <div className="flex items-center gap-2 mb-2">
        <Rocket className="text-green-400" size={22}/>
        <h1 className="text-xl font-bold">Growth Stocks</h1>
      </div>
      <p className="text-sm text-gray-400 mb-6">
        หุ้นเติบโตสูง — บริษัทที่มีรายได้/กำไรเติบโตเร็ว หรืออยู่ในธีมที่ตลาดให้ความสนใจ
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {stocks.map(st => (
          <div key={st.s} onClick={() => navigate(`/stock/${st.s}`)}
            className="bg-gray-800 border border-gray-700 hover:border-green-500 rounded-xl p-4 cursor-pointer transition-all">
            <div className="flex items-start justify-between mb-2">
              <span className="font-bold text-white">{st.s}</span>
              <TrendingUp size={14} className="text-green-400 shrink-0"/>
            </div>
            <div className="text-xs text-gray-400 truncate mb-2">{st.n}</div>
            {GROWTH_TAGS[st.s] && (
              <span className="text-[10px] bg-green-900/30 text-green-400 border border-green-700/30 rounded-full px-2 py-0.5 font-medium">
                {GROWTH_TAGS[st.s]}
              </span>
            )}
            <div className="mt-2 text-[10px] text-gray-600">{st.sec} · {st.cap} Cap</div>
          </div>
        ))}
      </div>
    </div>
  )
}
