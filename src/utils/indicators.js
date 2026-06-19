/**
 * Financial indicators calculations for Vestly charts
 */

// Helper to compute SMA
export function computeSMA(data, period, key = 'price', outKey = 'sma') {
  if (!data || data.length === 0) return data
  
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      data[i][outKey] = null
    } else {
      let sum = 0
      for (let j = 0; j < period; j++) {
        sum += data[i - j][key]
      }
      data[i][outKey] = sum / period
    }
  }
  return data
}

// Helper to compute EMA
export function computeEMA(data, period, key = 'price', outKey = 'ema') {
  if (!data || data.length === 0) return data
  if (data.length < period) {
    data.forEach(d => d[outKey] = null)
    return data
  }

  const k = 2 / (period + 1)
  
  // First EMA is SMA of the first window
  let sum = 0
  for (let i = 0; i < period; i++) {
    sum += data[i][key]
  }
  let currentEma = sum / period
  
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      data[i][outKey] = null
    } else if (i === period - 1) {
      data[i][outKey] = currentEma
    } else {
      currentEma = data[i][key] * k + currentEma * (1 - k)
      data[i][outKey] = currentEma
    }
  }
  return data
}

// Helper to compute Bollinger Bands
export function computeBollingerBands(data, period = 20, multiplier = 2, key = 'price', outUpper = 'bbUpper', outLower = 'bbLower', outMiddle = 'bbMiddle') {
  if (!data || data.length === 0) return data
  
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      data[i][outUpper] = null
      data[i][outLower] = null
      data[i][outMiddle] = null
    } else {
      // 1. Calculate Mean (SMA)
      let sum = 0
      for (let j = 0; j < period; j++) {
        sum += data[i - j][key]
      }
      const mean = sum / period
      data[i][outMiddle] = mean

      // 2. Calculate Variance & Standard Deviation
      let varianceSum = 0
      for (let j = 0; j < period; j++) {
        varianceSum += Math.pow(data[i - j][key] - mean, 2)
      }
      const stdDev = Math.sqrt(varianceSum / period)

      // 3. Calculate Bands
      data[i][outUpper] = mean + multiplier * stdDev
      data[i][outLower] = mean - multiplier * stdDev
    }
  }
  return data
}

// Helper to compute RSI (Relative Strength Index)
export function computeRSI(data, period = 14, key = 'price', outKey = 'rsi') {
  if (!data || data.length === 0) return data
  if (data.length < period + 1) {
    data.forEach(d => d[outKey] = null)
    return data
  }

  // Calculate price changes
  const gains = []
  const losses = []
  
  for (let i = 1; i < data.length; i++) {
    const diff = data[i][key] - data[i - 1][key]
    gains.push(diff > 0 ? diff : 0)
    losses.push(diff < 0 ? -diff : 0)
  }

  // Calculate initial averages
  let avgGain = 0
  let avgLoss = 0
  for (let i = 0; i < period; i++) {
    avgGain += gains[i]
    avgLoss += losses[i]
  }
  avgGain /= period
  avgLoss /= period

  data[0][outKey] = null
  for (let i = 1; i < data.length; i++) {
    if (i < period) {
      data[i][outKey] = null
    } else if (i === period) {
      const rs = avgLoss === 0 ? 100 : avgGain / avgLoss
      data[i][outKey] = 100 - 100 / (1 + rs)
    } else {
      // Wilder's smoothing
      avgGain = (avgGain * (period - 1) + gains[i - 1]) / period
      avgLoss = (avgLoss * (period - 1) + losses[i - 1]) / period
      const rs = avgLoss === 0 ? 100 : avgGain / avgLoss
      data[i][outKey] = 100 - 100 / (1 + rs)
    }
  }
  return data
}

// Helper to compute MACD
export function computeMACD(data, fast = 12, slow = 26, signal = 9, key = 'price', outMacd = 'macd', outSignal = 'macdSignal', outHist = 'macdHist') {
  if (!data || data.length === 0) return data
  
  // 1. Compute EMA12 & EMA26
  computeEMA(data, fast, key, '_emaFast')
  computeEMA(data, slow, key, '_emaSlow')
  
  // 2. Compute MACD Line = EMA12 - EMA26
  for (let i = 0; i < data.length; i++) {
    if (data[i]._emaFast == null || data[i]._emaSlow == null) {
      data[i][outMacd] = null
    } else {
      data[i][outMacd] = data[i]._emaFast - data[i]._emaSlow
    }
  }

  // 3. Compute Signal Line = EMA9 of MACD Line
  // We need to run EMA9 on the calculated MACD values. Since our EMA helper takes objects, we can use outMacd as the key.
  computeEMA(data, signal, outMacd, outSignal)

  // 4. Compute Histogram = MACD Line - Signal Line
  for (let i = 0; i < data.length; i++) {
    if (data[i][outMacd] == null || data[i][outSignal] == null) {
      data[i][outHist] = null
    } else {
      data[i][outHist] = data[i][outMacd] - data[i][outSignal]
    }
    
    // Clean up temporary calculations
    delete data[i]._emaFast
    delete data[i]._emaSlow
  }

  return data
}

// Main runner to compute all selected indicators on chart data
export function computeTechnicalIndicators(data, config = {}) {
  let computed = [...data]
  
  if (config.ma50) {
    computed = computeSMA(computed, 50, 'price', 'ma50')
  }
  if (config.ma200) {
    computed = computeSMA(computed, 200, 'price', 'ma200')
  }
  if (config.bb) {
    computed = computeBollingerBands(computed, 20, 2, 'price', 'bbUpper', 'bbLower', 'bbMiddle')
  }
  if (config.rsi) {
    computed = computeRSI(computed, 14, 'price', 'rsi')
  }
  if (config.macd) {
    computed = computeMACD(computed, 12, 26, 9, 'price', 'macd', 'macdSignal', 'macdHist')
  }
  
  return computed
}
