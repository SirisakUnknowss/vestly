// ── Peter Lynch 6-Category Classification ────────────────────────

export const LYNCH_CATEGORIES = {
  slowGrower:  { id: 'slowGrower',  label: 'Slow Grower',  emoji: '🐢', color: 'text-gray-300',   badge: 'bg-gray-600/30 text-gray-300 border-gray-500/40',   desc: 'เติบโตช้า ~2-4%/ปี มักจ่ายปันผลสูง' },
  stalwart:    { id: 'stalwart',    label: 'Stalwart',     emoji: '🏛️', color: 'text-blue-300',   badge: 'bg-blue-600/20 text-blue-300 border-blue-500/40',    desc: 'บริษัทใหญ่มั่นคง เติบโต 10-12%/ปี' },
  fastGrower:  { id: 'fastGrower',  label: 'Fast Grower',  emoji: '🚀', color: 'text-green-300',  badge: 'bg-green-600/20 text-green-300 border-green-500/40',  desc: 'เติบโตเร็ว 20%+/ปี โอกาสกำไรหลายเท่า' },
  cyclical:    { id: 'cyclical',    label: 'Cyclical',     emoji: '🔄', color: 'text-yellow-300', badge: 'bg-yellow-600/20 text-yellow-300 border-yellow-500/40',desc: 'ขึ้นลงตามวัฏจักรเศรษฐกิจ' },
  turnaround:  { id: 'turnaround',  label: 'Turnaround',   emoji: '♻️', color: 'text-orange-300', badge: 'bg-orange-600/20 text-orange-300 border-orange-500/40',desc: 'กำลังฟื้นตัวจากวิกฤต' },
  assetPlay:   { id: 'assetPlay',   label: 'Asset Play',   emoji: '💎', color: 'text-purple-300', badge: 'bg-purple-600/20 text-purple-300 border-purple-500/40',desc: 'สินทรัพย์ซ่อนอยู่ที่ตลาดยังไม่ตีมูลค่า' },
}

// Sectors ที่ชัดเจน → map ตรงๆ
const CYCLICAL_SECTORS   = ['Energy','Materials','Industrials','Industrial','Consumer Discretionary','Airlines','Automotive']
const ASSET_PLAY_SECTORS = ['Real Estate','Mining','Oil & Gas','Natural Resources']

/**
 * classify(metric, sector) → LYNCH_CATEGORIES key
 *
 * metric = Finnhub stock/metric response.metric object
 * sector = string from profile.finnhubIndustry or dividendStocks sector
 */
export function classify(metric = {}, sector = '', profile = {}) {
  const revGrowth5y  = metric.revenueGrowth5Y   ?? metric.revenueGrowthTTMYoy ?? null
  const epsGrowth5y  = metric.epsGrowth5Y        ?? metric.epsGrowthTTMYoy     ?? null
  const divYield     = metric.dividendYieldIndicatedAnnual ?? metric.currentDividendYieldTTM ?? 0
  const pe           = metric.peNormalizedAnnual  ?? metric.peTTM               ?? null
  const roe          = metric.roeTTM              ?? null
  const industry     = (sector || profile?.finnhubIndustry || '').toLowerCase()

  // ── 1. Asset Play — Real estate, mining, natural resources ──────
  if (ASSET_PLAY_SECTORS.some(s => industry.includes(s.toLowerCase())) ||
      industry.includes('real estate') || industry.includes('reit') ||
      industry.includes('mining') || industry.includes('gold') ||
      industry.includes('silver') || industry.includes('oil')) {
    return 'assetPlay'
  }

  // ── 2. Cyclical — ขึ้นลงตามเศรษฐกิจ ───────────────────────────
  if (CYCLICAL_SECTORS.some(s => industry.includes(s.toLowerCase())) ||
      industry.includes('steel') || industry.includes('chemical') ||
      industry.includes('auto') || industry.includes('airline') ||
      industry.includes('semiconductor') || industry.includes('construction')) {
    return 'cyclical'
  }

  // ── 3. Turnaround — EPS/revenue ติดลบ หรือ PE สูงผิดปกติ ───────
  if ((epsGrowth5y !== null && epsGrowth5y < -10) ||
      (revGrowth5y !== null && revGrowth5y < -5)  ||
      (pe !== null && pe < 0)) {
    return 'turnaround'
  }

  // ── 4. Fast Grower — เติบโตเร็ว ────────────────────────────────
  if ((revGrowth5y !== null && revGrowth5y >= 15) ||
      (epsGrowth5y !== null && epsGrowth5y >= 20)) {
    return 'fastGrower'
  }

  // ── 5. Slow Grower — เติบโตช้า + ปันผลสูง ──────────────────────
  if ((revGrowth5y !== null && revGrowth5y < 5) &&
      (divYield > 2 ||
       industry.includes('utilities') || industry.includes('telecom') ||
       industry.includes('tobacco') || industry.includes('communication'))) {
    return 'slowGrower'
  }

  if (industry.includes('utilities') || industry.includes('telecom')) {
    return 'slowGrower'
  }

  // ── 6. Stalwart — บริษัทใหญ่ เติบโตปานกลาง ─────────────────────
  return 'stalwart'
}

export const ALL_LYNCH_IDS = Object.keys(LYNCH_CATEGORIES)
