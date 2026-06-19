# Changelog

All notable changes to the **Vestly** project are documented here.

---

## [1.3.0] - 2026-06-18
### Added
- **Investment Journal (บันทึกการลงทุน):** A personal logbook for investment theses, allowing users to record tickers, buy targets, exits, classification tags (Value, Growth, Dividend, etc.), and custom notes. Includes Markdown text exports and print-friendly PDF saving.
- **Advanced Screener (ตัวกรองระดับสูง):** A compound screener to scan S&P 500 companies by combined metrics (P/E, ROE, Yield, D/E, Sector, Capitalization) alongside quick preset filters (e.g. GARP, Stalwarts).
- **Technical Indicators (อินดิเคเตอร์เทคนิค):** Moving averages (MA50, MA200) and Bollinger Bands overlaid directly on Recharts price details. Oscillator rows (RSI, MACD) and Volume charts rendered dynamically beneath.
- **Analyst Ratings (คะแนนนักวิเคราะห์):** A new stock detail tab showcasing Wall Street buy/hold/sell consensus shares and target upside calculations.
- **Macro Dashboard (เศรษฐกิจมหภาค):** Dashboard displaying interest rates (Fed funds), inflation (CPI), GDP, US dollar index (DXY), VIX fear index, and Treasury yields.

### Fixed
- Configured custom selector `@custom-variant dark` in Tailwind v4 to fix styling bugs under active user dark mode.
- Fixed invalid color classes (`text-gray-505`, `text-gray-905`, `emerald-650`, etc.) ensuring high contrast for Light & Dark mode text layers.

---

## [1.2.0] - 2026-06-18
### Added
- **Navigation Categories Layout:** Reorganized top header layout to use 4 core categories (Market Hub, Screener, Tools, AI Chat).
- **Desktop Sidebar:** Added a contextual left sidebar for nested paths within categories containing $\ge 2$ sub-items.
- **Mobile Sub-menu Horizontal Tab:** Sleek horizontal scrollable sub-bar beneath mobile headers.
- **Market Overview Dashboard:** Refactored default landing page (`/`) from a heavy S&P 500 table to a fast, visual dashboard with index ticks, starred watchlist items, quick gateway links, and strategy cards.

---

## [1.1.0] - 2026-06-18
### Added
- **AI Assistant:** AI chat integration powered by Google Gemini API (`gemini-1.5-flash`) with polite Thai prompts.
- **DCA Calculator:** A monthly investment backtester simulation utilizing historical prices from Twelve Data API.
- **Sector Heatmap:** Treemap performance summary of all S&P 500 sectors, featuring daily top gainers and losers.
- **Metric Glossary:** Absolute positioned floating helper definitions on financial metric headers.

---

## [1.0.0] - 2026-06-05
### Added
- **Core Market Engine:** Initial release containing paginated S&P 500 list, search, sector categorizations, and watchlist starring saved locally or on Supabase.
- **Stock Details:** Interactive charts, company profile summaries, and automatic Peter Lynch classifications.
