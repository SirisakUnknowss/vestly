# 📊 Vestly — Admin Dashboard Specification

> เอกสารออกแบบหน้า Dashboard สำหรับ monitor เว็บแอป Vestly (US Stock Tracker)
> ใช้เป็น blueprint ก่อน implement จริง

---

## 1. ภาพรวม (Overview)

Dashboard หลังบ้านนี้มีไว้เพื่อให้ admin/developer:
- **รู้ทันที** ว่าเว็บมีปัญหาหรือไม่
- **วัดผล** การใช้งานจริงของ user
- **ดู health** ของ API ภายนอก (Finnhub, Twelve Data)
- **ตรวจสอบ** performance และ error ที่เกิดขึ้น

---

## 2. โครงสร้าง Dashboard (Layout)

```
┌─────────────────────────────────────────────────────┐
│  🔷 VESTLY ADMIN DASHBOARD          ● Live  [Logout] │
├──────────┬──────────────────────────────────────────┤
│          │  📌 KPI Cards Row (top)                   │
│  SIDEBAR │  ─────────────────────────────────────── │
│          │  [Main Content Area]                      │
│  - Overview      │                                   │
│  - Users         │                                   │
│  - API Health    │                                   │
│  - Errors        │                                   │
│  - Performance   │                                   │
│  - Watchlist     │                                   │
└──────────┴──────────────────────────────────────────┘
```

---

## 3. ข้อมูลที่ต้องเก็บ (Data to Collect)

### 3.1 👥 User & Session Metrics

| ข้อมูล | วิธีเก็บ | ความถี่ |
|--------|---------|---------|
| Active users (DAU/WAU/MAU) | Session tracking | Real-time |
| Page views per page | Route tracking | Per navigation |
| Session duration | Start/End timestamp | Per session |
| Bounce rate | Single-page session | Per session |
| New vs Returning users | fingerprint / localStorage flag | Per visit |
| Device type (Mobile/Tablet/Desktop) | User-Agent parsing | Per session |
| Browser & OS | User-Agent parsing | Per session |
| Country / Region | IP geolocation | Per session |
| Peak usage hours | Timestamp aggregation | Hourly |

---

### 3.2 🔌 API Health Monitoring

เนื่องจาก Vestly พึ่งพา Finnhub และ Twelve Data เป็นหลัก ต้องติดตามใกล้ชิด:

#### Finnhub API
| ข้อมูล | วิธีเก็บ | ความถี่ |
|--------|---------|---------|
| API calls / minute | Counter | Real-time |
| Rate limit usage (60 req/min) | Header `X-RateLimit-Remaining` | Per call |
| WebSocket connection status (UP/DOWN) | WS event listener | Real-time |
| WebSocket reconnect count | Event counter | Per session |
| Quote latency (ms) | Response time measurement | Per call |
| Error rate (4xx / 5xx) | Error counter | Per call |
| Symbols currently subscribed | WS subscription list | Real-time |

#### Twelve Data API
| ข้อมูล | วิธีเก็บ | ความถี่ |
|--------|---------|---------|
| API calls / day (quota tracking) | Counter + localStorage | Per call |
| Candle data latency (ms) | Response time | Per call |
| Cache hit rate (div_metrics_v2) | Hit/Miss counter | Per call |
| Errors (429 Too Many Requests) | Error event | Per call |

---

### 3.3 🗂️ Feature Usage

| ข้อมูล | วิธีเก็บ | ความถี่ |
|--------|---------|---------|
| Most viewed stocks (symbol + count) | Event log | Per click |
| Watchlist size distribution | LocalStorage read | Per session |
| Stars/Favorites count | LocalStorage read | Per session |
| Page visits breakdown | Route counter | Per navigation |
| Dividend screener filters used | Event log (filter applied) | Per filter |
| Top Movers button click rate | Click event | Per click |
| Chart period selector usage (1D/1M/…) | Event log | Per click |
| Stock search queries | Input tracking | Per search |
| Search → Add conversion rate | Funnel tracking | Per search |

---

### 3.4 ⚡ Performance Metrics

| ข้อมูล | วิธีเก็บ | เป้าหมาย |
|--------|---------|---------|
| LCP (Largest Contentful Paint) | Web Vitals API | < 2.5s |
| FID / INP (Interaction to Next Paint) | Web Vitals API | < 200ms |
| CLS (Cumulative Layout Shift) | Web Vitals API | < 0.1 |
| TTFB (Time to First Byte) | Navigation Timing API | < 800ms |
| Bundle size (JS/CSS) | Build output | Track per deploy |
| Vite build time | CI/CD log | Per deploy |
| LocalStorage usage (KB) | `localStorage` size | Per session |
| Cache hit rate (sp500_cache, 10 min) | Hit/Miss counter | Per call |

---

### 3.5 🚨 Error Tracking

| ข้อมูล | วิธีเก็บ | ความสำคัญ |
|--------|---------|---------|
| JavaScript runtime errors | `window.onerror` / `ErrorBoundary` | 🔴 Critical |
| Unhandled Promise rejections | `unhandledrejection` event | 🔴 Critical |
| API fetch failures (with symbol) | try/catch + log | 🟠 High |
| WebSocket disconnect events | WS `onerror` / `onclose` | 🟠 High |
| 404 route errors | Router fallback | 🟡 Medium |
| Component render errors | React ErrorBoundary | 🟠 High |
| LocalStorage quota exceeded | Storage error event | 🟡 Medium |

สิ่งที่ต้องบันทึกต่อ error 1 ครั้ง:
```
{
  timestamp: "2026-06-11T16:04:00Z",
  type: "API_FETCH_FAIL" | "JS_ERROR" | "WS_DISCONNECT" | ...,
  message: "string",
  stack: "...",
  page: "/stock/AAPL",
  symbol: "AAPL",         // ถ้าเกี่ยวข้อง
  apiSource: "finnhub",   // ถ้าเกี่ยวข้อง
  userId: "anon_xxx",
  sessionId: "sess_xxx"
}
```

---

### 3.6 📦 Deployment & System Info

| ข้อมูล | วิธีเก็บ | ความถี่ |
|--------|---------|---------|
| Current app version | `package.json` version | Per deploy |
| Last deployed at | CI/CD timestamp | Per deploy |
| Git commit hash | Build env variable | Per deploy |
| Uptime | Server/CDN heartbeat | Continuous |
| CDN / Hosting status | Ping check | Every 1 min |

---

## 4. หน้าในของ Dashboard (Dashboard Sections)

### 4.1 🏠 Overview (หน้าแรก)

**KPI Cards (Top Row):**
```
┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ Active Users │ │ API Calls    │ │  Errors      │ │  Avg. LCP    │
│    127 👥    │ │  1,430/hr ⚡ │ │   3 🔴       │ │   1.8s ✅    │
│  ↑12% today  │ │  76% of limit│ │  ↓2 vs ytd   │ │   Good       │
└──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘
```

**Charts:**
- 📈 Line chart: Active users (24 ชม. ที่ผ่านมา)
- 📊 Bar chart: Page views per page (Watchlist / StockDetail / Dividend)
- 🌐 Real-time API call rate (Finnhub vs quota limit)

---

### 4.2 🔌 API Health

```
┌────────────────────────────────────────────────────┐
│  FINNHUB                           STATUS: 🟢 UP   │
│  WebSocket: Connected (127 symbols subscribed)      │
│  REST calls: 42/60 per minute  ████████░░ 70%       │
│  Latency: avg 89ms  [P95: 210ms]                    │
├────────────────────────────────────────────────────┤
│  TWELVE DATA                       STATUS: 🟢 UP   │
│  Daily quota: 800/8000 calls used  ██░░░░░░░░ 10%  │
│  Cache hit rate: 78% (div_metrics) ████████░░ 78%  │
│  Latency: avg 340ms                                 │
└────────────────────────────────────────────────────┘
```

**Charts:**
- Timeline: API error rate ย้อนหลัง 24 ชม.
- Pie: Cache HIT vs MISS ratio
- Gauge: Rate limit utilization

---

### 4.3 👥 User Analytics

**Charts:**
- Line: DAU / WAU / MAU trend
- Bar: Session duration distribution (< 1min, 1-5min, 5-15min, 15min+)
- Donut: Device type breakdown (Desktop/Mobile/Tablet)
- Map: User geography (Country heatmap)
- Funnel: Search → View Stock → Add to Watchlist → Click Chart

**Table: Top Viewed Stocks**
```
| # | Symbol | Company        | Views | Avg Time on Page |
|---|--------|----------------|-------|-----------------|
| 1 | AAPL   | Apple Inc.     | 312   | 4m 20s          |
| 2 | NVDA   | NVIDIA Corp.   | 287   | 5m 10s          |
| 3 | MSFT   | Microsoft      | 201   | 3m 45s          |
```

---

### 4.4 🚨 Error Log

**Filter bar:** `[ All ] [ Critical ] [ API ] [ JS ] [ WS ]`  
**Time range:** Last 1h / 6h / 24h / 7d

**Table:**
```
| Time       | Type            | Message                    | Page          | Cnt | Status   |
|------------|-----------------|----------------------------|---------------|-----|----------|
| 23:04:12   | API_FETCH_FAIL  | Finnhub 429 Too Many Reqs  | /stock/TSLA   |  5  | 🔴 Open  |
| 22:51:33   | WS_DISCONNECT   | WebSocket closed (code 1006)| /             |  2  | 🟡 Watch |
| 21:00:07   | JS_ERROR        | Cannot read prop of null   | /dividends    |  1  | 🟢 Fixed |
```

---

### 4.5 ⚡ Performance

**Core Web Vitals Panel:**
```
  LCP          FID/INP        CLS
  1.8s ✅      45ms ✅        0.03 ✅
  Good         Good           Good
```

**Charts:**
- Line: LCP trend over 7 days (per deploy)
- Bar: Page load time breakdown (TTFB / FCP / LCP)
- Histogram: API call latency distribution

---

### 4.6 📋 Feature Usage (Heatmap)

**Most Used Features:**
```
  ████████████████░░  Watchlist view          94%
  ██████████████░░░░  Stock detail chart      82%
  ████████░░░░░░░░░░  Dividend screener       51%
  ██████░░░░░░░░░░░░  Top Movers button       38%
  ████░░░░░░░░░░░░░░  Search & Add stock      24%
  ██░░░░░░░░░░░░░░░░  Star/Favorites          13%
```

**Chart Period Usage (Donut):**
1D → 1M → 3M → 1Y (เรียงตามนิยม)

---

## 5. Data Collection Architecture

```
Browser (Vestly App)
    │
    ├── Web Vitals SDK  ──────────────────────────────┐
    ├── Custom Event Logger (analytics.js)            │
    │   ├── page views                                │
    │   ├── feature clicks                            │
    │   ├── API call results                          ▼
    │   └── error catches              Analytics Collector
    │                                       │
    └── Error Boundary (React)         (Backend Service)
                                            │
                                    ┌───────┴────────┐
                                    ▼                ▼
                               Time-series DB    Event DB
                               (InfluxDB /     (Firestore /
                                Prometheus)      Supabase)
                                    │
                                    ▼
                           Dashboard Frontend
                           (React Admin Panel)
```

---

## 6. Stack แนะนำสำหรับ Backend Dashboard

| Layer | ตัวเลือก | เหตุผล |
|-------|---------|--------|
| Analytics collector | **Supabase** หรือ **Firebase** | ง่าย, ไม่ต้องตั้ง server |
| Time-series metrics | **InfluxDB Cloud** หรือ **Grafana Cloud** | เหมาะกับข้อมูล time-based |
| Error tracking | **Sentry** (free tier) | มี SDK พร้อม, alert email |
| Web Vitals | **web-vitals** npm package | Google ดูแล, แม่นยำ |
| Dashboard UI | **React** + **Recharts** | ใช้ stack เดิม |
| Auth (admin) | **Firebase Auth** | เชื่อมกับ stack ได้เลย |

---

## 7. Priority การ Implement

| Priority | หมวด | เหตุผล |
|----------|------|--------|
| 🔴 P1 | API Health (Finnhub rate limit) | กระทบ user โดยตรงถ้า API หมด quota |
| 🔴 P1 | Error tracking (JS + API errors) | ต้องรู้ทันทีถ้าเว็บพัง |
| 🟠 P2 | Active users + page views | วัด engagement |
| 🟠 P2 | WebSocket monitor | Watchlist ขึ้นกับ WS ทั้งหมด |
| 🟡 P3 | Performance (Core Web Vitals) | สำคัญแต่ไม่ urgent |
| 🟡 P3 | Feature usage heatmap | ใช้ plan product roadmap |
| 🟢 P4 | Geography, device breakdown | Nice-to-have |

---

## 8. Alert Rules (Notification เมื่อเกิดเหตุการณ์)

| เหตุการณ์ | Threshold | แจ้งเตือนผ่าน |
|-----------|-----------|--------------|
| Finnhub rate limit > 90% | > 54/60 req/min | Line Notify / Email |
| JavaScript error spike | > 10 errors/min | Email + Slack |
| WebSocket disconnect | > 3 ครั้งใน 5 นาที | Email |
| Twelve Data quota > 80% | > 6400/8000 calls | Email |
| LCP degraded | > 4.0s (Poor) | Email |
| Zero active users (unexpected) | 0 users during peak hours | Email |

---

*สร้างโดย: Antigravity AI — วันที่ 11 มิถุนายน 2026*
