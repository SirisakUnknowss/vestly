# 🚀 Vestly — Feature Ideas & Roadmap

> **เป้าหมาย:** ทำให้ Vestly เป็นเครื่องมือที่คนไทยอยากเปิดทุกวัน ทั้งมือใหม่ที่เพิ่งหัดลงทุน และนักลงทุนที่มีประสบการณ์แล้ว

---

## ✅ สิ่งที่มีอยู่แล้ว

| Feature | หน้า |
|---------|------|
| ดูรายชื่อหุ้น S&P 500 ทั้งหมด | Markets |
| Watchlist (ติดดาวหุ้น) | Watchlist |
| Dividend Screener + filter | Dividends |
| Growth Stocks curated list | Growth |
| Hot Movers | Hot |
| Stock Hunter — Scan → Financial → SWOT | Hunter |
| Stock Detail + Chart 1D–1Y | /stock/:symbol |
| Calendar Hub (ปฏิทินปันผล & ประกาศงบพร้อมเครื่องคำนวณ) | Calendar |

---

## 🎯 Priority Tier 1 — Quick Win (ผลกระทบสูง ทำได้เร็ว)

### 1. 💼 Virtual Portfolio (Port จำลอง)
**เหมาะกับ:** มือใหม่ที่ยังกลัวเสียเงินจริง

ให้ผู้ใช้สร้าง portfolio จำลองด้วยเงินสมมุติ (เช่น $100,000 เริ่มต้น) แล้วซื้อ/ขายหุ้นในราคาจริง เพื่อฝึกจิตใจและทดสอบกลยุทธ์โดยไม่ต้องเสียเงินจริง

**Features ย่อย:**
- ซื้อ/ขายหุ้นในราคา real-time
- เห็น P&L รายตัว และ Portfolio โดยรวม
- ดู % Return เทียบกับ S&P 500 (Benchmark)
- History การเทรด

**Business Value:** คนจะเล่นทุกวัน → DAU สูงขึ้นมาก

---

### 2. 🔔 Price Alert (แจ้งเตือนราคา)
**เหมาะกับ:** ทุกคน

ตั้งเป้าราคาซื้อ/ขาย แล้วรับ notification เมื่อหุ้นถึงราคาที่ต้องการ

**Features ย่อย:**
- ตั้ง Alert "ซื้อถ้าราคาต่ำกว่า $X"
- ตั้ง Alert "ขายถ้าราคาสูงกว่า $X"
- รับแจ้งเตือนผ่าน Browser Notification หรือ Email
- Alert สำหรับ % Drop จาก ATH

**Business Value:** ดึง user กลับมาเปิดแอปซ้ำ

---

### 3. 📊 Stock Compare (เปรียบเทียบหุ้น)
**เหมาะกับ:** ทุกคน

เลือกหุ้น 2-3 ตัว แล้วดูกราฟราคา + Key Metrics เคียงข้างกัน

**Features ย่อย:**
- Overlay chart (กราฟซ้อนกัน normalized เป็น %)
- ตาราง Key Metrics เคียงกัน: P/E, ROE, Revenue Growth, Dividend Yield
- บอกว่าตัวไหน "Cheaper" หรือ "Stronger"

**ตัวอย่าง:** AAPL vs MSFT vs GOOGL — ใครดีกว่ากัน?

---

### 4. 📅 Calendar Hub (ปฏิทินประกาศผลกำไร & ปันผล) ✅ เสร็จแล้ว
**เหมาะกับ:** ทุกคน

ออกแบบหน้า **Calendar** ให้เป็นศูนย์รวมปฏิทินเหตุการณ์สำคัญ โดยมีแท็บ/ตัวเลือก ให้เลือกสลับการแสดงผลระหว่าง **Earnings** และ **Dividend** เพื่อให้ประหยัดพื้นที่และไม่ทับซ้อนกัน

**Features ย่อย:**
- **Earnings Calendar Tab:**
  - ปฏิทินประกาศงบรายสัปดาห์/รายเดือน
  - แสดง EPS Estimate vs Actual (หลังประกาศ) พร้อมเปรียบเทียบประวัติย้อนหลัง
  - ไฮไลต์หุ้นที่ประกาศงบ "Beat" / "Miss"
  - กรองเฉพาะหุ้นที่อยู่ใน Watchlist หรือพอร์ตโฟลิโอ
- **Dividend Calendar Tab:**
  - ปฏิทินรายเดือน แสดง Ex-Dividend Date (วันที่ซื้อเพื่อได้สิทธิ์) และ Payment Date (วันที่รับเงิน)
  - แสดงจำนวนปันผลต่อหุ้น และ % Dividend Yield
  - สรุปยอดเงินปันผลสะสมที่คาดว่าจะได้รับในแต่ละเดือน/ปี
  - กรองการจ่ายเงินปันผลเฉพาะหุ้นที่ผู้ใช้ติดดาวไว้

**ทำไมสำคัญ:** รวบรวมข้อมูลเหตุการณ์สำคัญทางการเงินที่ส่งผลต่อการตัดสินใจซื้อ/ขาย และการวางแผนรับเงินปันผลไว้ที่เดียวกันโดยไม่ต้องแยกหลายเมนู

---

### 5. 💡 คำอธิบายตัวชี้วัด (Metric Glossary)
**เหมาะกับ:** มือใหม่โดยเฉพาะ

ทุก metric ที่แสดง (P/E, ROE, EPS, Yield ฯลฯ) ควรมี tooltip หรือ popup อธิบายว่าคืออะไร ดูยังไง ดีหรือไม่ดีที่ตัวเลขเท่าไหร่

**ตัวอย่าง:**
> **ROE = 28.4%** → กดเพื่อเรียนรู้: ROE คือผลตอบแทนต่อส่วนผู้ถือหุ้น ยิ่งสูงยิ่งดี ค่าดีอยู่ที่ >15%

**Business Value:** ลด learning curve → มือใหม่ไม่หนี

---

## 🎯 Priority Tier 2 — Medium Term (ผลกระทบสูง ใช้เวลาพอสมควร)

### 6. 📰 Stock News Feed (ข่าวหุ้น)
**เหมาะกับ:** ทุกคน

ดูข่าวล่าสุดที่เกี่ยวข้องกับหุ้นแต่ละตัว โดยเฉพาะหุ้นใน Watchlist

**Features ย่อย:**
- ข่าวจาก Finnhub News API (มีฟรี)
- กรองเฉพาะหุ้นที่ติดตาม
- Sentiment Analysis อัตโนมัติ (Positive / Negative / Neutral)
- "ข่าวร้อน" ประจำวัน

---

### 7. 📐 Technical Indicators (ตัวชี้วัดทางเทคนิค)
**เหมาะกับ:** นักลงทุนระดับกลางขึ้นไป

เพิ่มเส้น Indicator บนกราฟใน Stock Detail

**Indicators ที่ควรมี:**
- **MA50 / MA200** — Moving Average
- **RSI** — บอก Overbought/Oversold
- **MACD** — สัญญาณซื้อ/ขาย
- **Bollinger Bands** — ความผันผวน
- **Volume** — ปริมาณการซื้อขาย

---

### 8. 🔍 Advanced Screener (ตัวกรองขั้นสูง)
**เหมาะกับ:** นักลงทุน Value / Growth

ค้นหาหุ้นด้วยเกณฑ์หลายอย่างพร้อมกัน

**Filter ที่ควรมี:**
- P/E < 20, ROE > 15%, Revenue Growth > 10%
- Market Cap (Small/Mid/Large Cap)
- Sector / Industry
- Dividend Yield range
- 52-Week Performance
- Debt/Equity ratio

**ตัวอย่าง Preset:** "หุ้น GARP" (Growth at Reasonable Price), "หุ้นปันผล Low Risk", "หุ้น Undervalued"

---

### 9. 🧮 DCA Calculator (คำนวณลงทุนแบบ DCA)
**เหมาะกับ:** มือใหม่

Dollar-Cost Averaging คือการลงทุนสม่ำเสมอทุกเดือน เป็น strategy ที่เหมาะสำหรับมือใหม่ที่สุด

**Features ย่อย:**
- เลือกหุ้น + จำนวนเงิน/เดือน + ระยะเวลา
- จำลองย้อนหลัง: ถ้าซื้อ AAPL $100/เดือน 5 ปีที่แล้ว จะได้เท่าไหร่?
- เปรียบเทียบ DCA vs Lump Sum
- แสดงผลเป็นกราฟ

---

### 10. 🏭 Sector Heatmap (แผนที่ความร้อน Sector)
**เหมาะกับ:** ทุกคน

แสดงภาพรวมตลาดแบบ Heatmap แสดงว่า Sector ไหนขึ้น/ลงวันนี้ บริษัทไหน Hot ที่สุด

**Layout:** สี่เหลี่ยมขนาดต่างๆ ตาม Market Cap, สีแดง/เขียวตาม % Change (เหมือน Finviz)

---

### 11. 📓 Investment Journal (บันทึกการลงทุน)
**เหมาะกับ:** นักลงทุนที่อยากพัฒนาตัวเอง

บันทึก "Investment Thesis" ของแต่ละหุ้นที่ซื้อ — ซื้อเพราะอะไร? คาดหวังอะไร? ผลที่ได้จริง?

**Features ย่อย:**
- เขียน note แนบกับหุ้นแต่ละตัว
- บันทึกราคาที่ซื้อ + เหตุผล
- Review ย้อนหลัง: Thesis ที่เขียนไว้ถูกต้องไหม?
- Export เป็น PDF

**Business Value:** สร้าง Habit ของการลงทุนอย่างมีวินัย

---

### 12. 🎓 Vestly Academy (สอนลงทุน)
**เหมาะกับ:** มือใหม่

Content สั้นๆ สอนพื้นฐานการลงทุนในหุ้น สไตล์ง่าย อ่านเร็ว

**Topics:**
- P/E Ratio คืออะไร? อ่านยังไง?
- Warren Buffett ลงทุนยังไง?
- Dividend vs Growth Stock ต่างกันยังไง?
- Risk Management คืออะไร?
- การอ่าน Financial Statement เบื้องต้น
- Dollar-Cost Averaging คืออะไร?

**Format:** บทความสั้น 3-5 นาที + Quiz ท้ายบทเรียน

---

## 🎯 Priority Tier 3 — Long Term (ใช้เวลานาน แต่คุ้มค่า)

### 13. 👤 User Portfolio Tracker (ติดตาม Port จริง)
**เหมาะกับ:** นักลงทุนที่มี portfolio อยู่แล้ว

กรอกหุ้นที่ถืออยู่จริง (ไม่ต้องเชื่อมโบรกเกอร์) แล้วดู P&L รวม, Asset Allocation, ผลตอบแทน

**Features ย่อย:**
- กรอก: Symbol, จำนวนหุ้น, ราคาที่ซื้อ, วันที่ซื้อ
- คำนวณ: Unrealized P&L, % Return, Cost Basis
- เปรียบเทียบกับ Benchmark (S&P 500 / QQQ)
- Pie chart แสดง Asset Allocation ตาม Sector
- ดูว่าหุ้นในพอร์ตจะได้รับปันผลวันไหนบ้าง

---

### 14. 🤖 AI Stock Assistant (ถามตอบด้วย AI)
**เหมาะกับ:** ทุกคน

Chat กับ AI เพื่อถามเรื่องหุ้นได้เลย ไม่ต้องออกไปหาข้อมูลที่อื่น

**ตัวอย่างคำถาม:**
> "AAPL เทียบกับ MSFT ตอนนี้ตัวไหนถูกกว่า?"
> "หุ้นปันผล yield สูงสุดใน S&P 500 ตอนนี้คืออะไร?"
> "อธิบาย Gross Margin 38% ของ AOS ให้ฟังหน่อย"

---

### 15. 📉 Insider Trading Tracker (ติดตามผู้บริหารซื้อ/ขาย)
**เหมาะกับ:** นักลงทุนระดับกลาง-สูง

ดูว่า CEO/CFO/ผู้บริหารซื้อหรือขายหุ้นบริษัทตัวเองล่าสุด — เป็นสัญญาณสำคัญที่คนทั่วไปมักมองข้าม

**Features ย่อย:**
- รายการ Insider Transaction ล่าสุด
- Filter เฉพาะ "Insider Buy" (น่าสนใจมากกว่า Insider Sell)
- แจ้งเตือนเมื่อมี Insider Buy ในหุ้นที่ติดตาม

---

### 16. 📊 Analyst Ratings (Rating จากนักวิเคราะห์)
**เหมาะกับ:** ทุกคน

ดู consensus rating จากนักวิเคราะห์ Wall Street: Buy / Hold / Sell พร้อม Price Target

**Features ย่อย:**
- % ของนักวิเคราะห์ที่บอก Buy/Hold/Sell
- Price Target สูงสุด/ต่ำสุด/เฉลี่ย
- Upside/Downside จากราคาปัจจุบัน
- ประวัติการเปลี่ยน Rating

---

### 17. 🌐 Macro Dashboard (ภาพรวมเศรษฐกิจ)
**เหมาะกับ:** นักลงทุนที่ดูภาพใหญ่

ข้อมูล Macro สำคัญที่กระทบตลาดหุ้น

**ข้อมูลที่ควรมี:**
- Fed Funds Rate + กำหนดประชุม FOMC ครั้งถัดไป
- CPI (เงินเฟ้อ) ล่าสุด
- GDP Growth
- US Dollar Index (DXY)
- VIX (ความกลัวตลาด)
- 10-Year Treasury Yield

---

## 🎨 UX Improvements ที่ควรทำควบคู่

| ปัญหาปัจจุบัน | วิธีแก้ที่แนะนำ |
|--------------|----------------|
| Watchlist ต้อง Sign In ถึงใช้ได้ | ให้ Guest ใช้ Local Watchlist ได้ก่อน |
| ไม่มี Dark Mode | เพิ่ม Dark Mode — นักลงทุนดูกราฟกลางคืนเยอะมาก |
| Mobile UX ยังไม่ smooth | Bottom Navigation สำหรับ Mobile |
| ไม่มี Onboarding | Tutorial สั้นๆ สำหรับ User ใหม่ |
| หน้า Stock Detail ไม่มี Peer Comparison | เพิ่ม "หุ้นในกลุ่มเดียวกัน" |

---

## 🏆 Feature ที่น่าจะ "Viral" ที่สุด

```
ลำดับที่คนจะแชร์ / บอกต่อมากที่สุด:

1. 🥇 Virtual Portfolio — "Port จำลองฉันได้ +47% ปีนี้!" → แชร์ Social
2. 🥈 DCA Calculator — "ถ้าซื้อ NVDA $100/เดือน 3 ปีที่แล้ว ตอนนี้ได้ $X,XXX"
3. 🥉 Stock Hunter ที่มีอยู่แล้ว — ทำ Shareable Result ให้แชร์ได้
```

---

## 📋 สรุป Priority Matrix

| Feature | Impact | Effort | Priority |
|---------|--------|--------|----------|
| Virtual Portfolio | ⭐⭐⭐⭐⭐ | Medium | 🔴 สูงมาก |
| Price Alert | ⭐⭐⭐⭐⭐ | Low | 🔴 สูงมาก |
| Metric Glossary (Tooltip) | ⭐⭐⭐⭐ | Low | 🔴 สูงมาก |
| Calendar (Earnings & Dividend Tabs) | ⭐⭐⭐⭐⭐ | Medium-High | ✅ เสร็จแล้ว |
| Stock Compare | ⭐⭐⭐⭐ | Low | 🟠 สูง |
| DCA Calculator | ⭐⭐⭐⭐ | Low | 🟠 สูง |
| Dark Mode | ⭐⭐⭐⭐ | Low | 🟠 สูง |
| Advanced Screener | ⭐⭐⭐⭐ | Medium | 🟡 กลาง |
| Sector Heatmap | ⭐⭐⭐ | Medium | 🟡 กลาง |
| News Feed | ⭐⭐⭐ | Medium | 🟡 กลาง |
| Technical Indicators | ⭐⭐⭐ | High | 🟡 กลาง |
| Vestly Academy | ⭐⭐⭐⭐ | High | 🟡 กลาง |
| AI Assistant | ⭐⭐⭐⭐⭐ | High | 🟢 ระยะยาว |
| Portfolio Tracker | ⭐⭐⭐⭐⭐ | High | 🟢 ระยะยาว |
| Insider Trading | ⭐⭐⭐ | High | 🟢 ระยะยาว |
| Analyst Ratings | ⭐⭐⭐ | High | 🟢 ระยะยาว |
| Macro Dashboard | ⭐⭐⭐ | Medium | 🟢 ระยะยาว |

---

*อัพเดทล่าสุด: มิถุนายน 2026 — ยินดีรับ feedback และไอเดียเพิ่มเติม*
