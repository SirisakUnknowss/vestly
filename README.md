# 📈 US Stock Tracker

แอปดูหุ้นอเมริกา real-time พร้อมข้อมูลปันผล สร้างด้วย React + Vite

## 🚀 Quick Start

```bash
# ติดตั้ง dependencies
npm install

# รัน dev server
npm run dev
```

เปิดเบราว์เซอร์ที่ **http://localhost:5173**

---

## ✨ Features

| หน้า | ฟีเจอร์ |
|------|---------|
| **Watchlist** `/` | ดูราคาหุ้น real-time, ค้นหา, ติดดาว, Top Movers S&P 500 |
| **Stock Detail** `/stock/:symbol` | กราฟราคา 1D–1Y, ข้อมูลบริษัท, ข้อมูลปันผล |
| **Dividend Page** `/dividends` | หุ้นปันผลอเมริกา ~250 ตัว, filter ตาม frequency / sector / yield |

---

## 🗂️ Project Structure

```
src/
├── App.jsx              # Watchlist หน้าหลัก
├── main.jsx             # Router setup
├── index.css            # Tailwind + global styles
├── sp500.js             # รายชื่อหุ้น S&P 500 (~503 ตัว)
├── data/
│   └── dividendStocks.js  # รายชื่อหุ้นปันผล + metadata
└── pages/
    ├── StockDetail.jsx    # หน้า detail กราฟ + dividend metrics
    └── DividendPage.jsx   # หน้า dividend screener
```

---

## 🔌 API Keys & Data Sources

| Source | ใช้ทำอะไร | Key |
|--------|----------|-----|
| **Finnhub** | Real-time quote (WebSocket + REST), company profile, dividend metrics | `d8fg29hr...` ใน `src/App.jsx` และ `src/pages/StockDetail.jsx` |
| **Twelve Data** | Historical candle data สำหรับกราฟ | `demo` key (ฟรี มี quota จำกัด) |

> ⚠️ **Finnhub free tier:** 60 API calls/minute — S&P 500 Top Movers จะใช้เวลา ~9 นาทีในการโหลดครั้งแรก แต่ cache ไว้ 10 นาที

### เปลี่ยน API Key

**Finnhub** — แก้ไขใน 2 ไฟล์:
```js
// src/App.jsx  บรรทัด 4
const API_KEY = 'YOUR_FINNHUB_KEY'

// src/pages/StockDetail.jsx  บรรทัด 12
const FINNHUB_KEY = 'YOUR_FINNHUB_KEY'
```

**Twelve Data** — สมัครฟรีที่ [twelvedata.com](https://twelvedata.com) แล้วแก้:
```js
// src/pages/StockDetail.jsx  บรรทัด ~127
apikey: 'YOUR_TWELVE_DATA_KEY',
```

---

## 📄 Pages

### `/` — Watchlist

- **Real-time price** ผ่าน Finnhub WebSocket (flash เขียว/แดงเมื่อราคาเปลี่ยน)
- **ค้นหาหุ้น** — พิมพ์ชื่อหรือ symbol แล้วกด Add
- **Quick add** — ปุ่มหุ้ยยอดนิยมด้านล่าง
- **ติดดาว** — กดดาวที่การ์ด, กรอง tab "ดาว"
- **Filter ปันผล** — Monthly / Quarterly / Semi-Annual / Annual
- **Top Movers** — กดปุ่มสีน้ำเงิน, โหลด S&P 500 ทั้งหมด, เรียงตาม % หรือ $
- **คลิกการ์ด** → ไปหน้า Stock Detail

### `/stock/:symbol` — Stock Detail

**แท็บ Chart:**
- Period selector: `1D` `5D` `1W` `1M` `3M` `6M` `YTD` `1Y`
- Area chart พร้อม gradient สีเขียว/แดง
- Reference line แสดงราคาเริ่มต้นช่วง
- การเปลี่ยนแปลงราคาคำนวณจาก chart (ไม่ใช่ today เสมอ)
- Stats: Open / High / Low / Prev Close
- Company Info: ตลาด, อุตสาหกรรม, Market Cap, IPO

**แท็บ Dividend:**
- Dividend Yield (Indicated Annual)
- Annual DPS, TTM DPS, 5Y Growth, Payout Ratio, EPS

### `/dividends` — Dividend Screener

- หุ้นปันผล ~250 ตัว จากทุก sector
- **Filter:** Frequency (Monthly/Quarterly/Semi-Annual/Annual), Sector, Min Yield
- **Sort:** Yield, Annual Dividend, Price, % Change
- **View:** Table หรือ Cards
- **Cache 30 นาที** — โหลดซ้ำใน 30 นาทีใช้ cache ทันที

---

## 💾 LocalStorage Keys

| Key | เก็บอะไร | TTL |
|-----|---------|-----|
| `stocks` | รายชื่อหุ้นใน watchlist | ถาวร |
| `starred` | หุ้นที่ติดดาว | ถาวร |
| `sp500_cache` | ราคา S&P 500 ทั้งหมด | 10 นาที |
| `div_metrics_v2` | Dividend metrics ของแต่ละหุ้น | 30 นาที |
| `div_freq_cache` | Dividend frequency ของหุ้นใน watchlist | ถาวร |

---

## 🛠️ Scripts

```bash
npm run dev      # รัน dev server ที่ localhost:5173
npm run build    # Build production ไปที่ dist/
npm run preview  # Preview production build
```

---

## 🧱 Tech Stack

- **React 18** + **Vite 5**
- **Tailwind CSS v4**
- **React Router v7**
- **Recharts** — Area chart
- **Lucide React** — Icons
