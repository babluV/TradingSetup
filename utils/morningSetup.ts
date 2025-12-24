import { CandlestickData } from '@/types/trading';

export interface MorningSetup {
  trend: 'uptrend' | 'downtrend' | 'sideways';
  trendStrength: number; // 0-100
  suggestion: 'buy_call' | 'buy_put' | 'wait';
  confidence: number; // 0-100
  keyLevels: {
    support: number;
    resistance: number;
    pivot: number;
  };
  reasoning: string[];
  preMarketAnalysis: {
    overnightGap: number;
    gapPercent: number;
    gapDirection: 'up' | 'down' | 'neutral';
  };
  tradingStrategy: {
    entryStrategy: string;
    stopLoss: number;
    target1: number;
    target2: number;
  };
}

/**
 * Analyzes previous day's data to provide morning setup prediction
 * This runs before market opens at 9:15 AM IST
 */
export function generateMorningSetup(data: CandlestickData[]): MorningSetup {
  if (data.length < 20) {
    return getDefaultSetup();
  }

  // Get previous day's data (last trading session)
  // Assuming 15-min candles, previous day = last ~96 candles
  const previousDayData = data.slice(-96);
  if (previousDayData.length < 20) {
    return getDefaultSetup();
  }

  const lastPrice = previousDayData[previousDayData.length - 1].close;
  const firstPrice = previousDayData[0].open;
  const dayHigh = Math.max(...previousDayData.map(d => d.high));
  const dayLow = Math.min(...previousDayData.map(d => d.low));
  const dayClose = lastPrice;
  const dayOpen = firstPrice;

  // Calculate technical indicators
  const ema9 = calculateEMA(previousDayData, 9);
  const ema21 = calculateEMA(previousDayData, 21);
  const ema50 = calculateEMA(previousDayData, 50);
  const rsi = calculateRSI(previousDayData);
  const volumeAnalysis = analyzeVolume(previousDayData);

  // Calculate Pivot Point (Standard Pivot)
  const pivot = (dayHigh + dayLow + dayClose) / 3;
  const resistance1 = 2 * pivot - dayLow;
  const support1 = 2 * pivot - dayHigh;

  // Determine trend
  let trend: 'uptrend' | 'downtrend' | 'sideways' = 'sideways';
  let trendStrength = 0;
  const reasoning: string[] = [];

  // EMA Trend Analysis
  const emaBullish = ema9 > ema21 && ema21 > ema50;
  const emaBearish = ema9 < ema21 && ema21 < ema50;
  const priceAboveEMA = dayClose > ema9;

  if (emaBullish && priceAboveEMA) {
    trend = 'uptrend';
    trendStrength += 40;
    reasoning.push('✅ Strong EMA Bullish Alignment (EMA9 > EMA21 > EMA50)');
    reasoning.push('✅ Price closed above EMA9 - Bullish momentum');
  } else if (emaBearish && !priceAboveEMA) {
    trend = 'downtrend';
    trendStrength += 40;
    reasoning.push('✅ Strong EMA Bearish Alignment (EMA9 < EMA21 < EMA50)');
    reasoning.push('✅ Price closed below EMA9 - Bearish momentum');
  } else {
    reasoning.push('⚠️ Mixed EMA signals - Sideways trend');
  }

  // Price Action Analysis
  const dayChange = dayClose - dayOpen;
  const dayChangePercent = (dayChange / dayOpen) * 100;

  if (dayChangePercent > 0.5) {
    trendStrength += 20;
    reasoning.push(`✅ Strong bullish day: +${dayChangePercent.toFixed(2)}%`);
    if (trend === 'sideways') trend = 'uptrend';
  } else if (dayChangePercent < -0.5) {
    trendStrength += 20;
    reasoning.push(`✅ Strong bearish day: ${dayChangePercent.toFixed(2)}%`);
    if (trend === 'sideways') trend = 'downtrend';
  } else {
    reasoning.push(`➡️ Neutral day: ${dayChangePercent >= 0 ? '+' : ''}${dayChangePercent.toFixed(2)}%`);
  }

  // RSI Analysis
  if (rsi > 60 && trend === 'uptrend') {
    trendStrength += 15;
    reasoning.push(`✅ RSI (${rsi.toFixed(1)}) confirms bullish trend`);
  } else if (rsi < 40 && trend === 'downtrend') {
    trendStrength += 15;
    reasoning.push(`✅ RSI (${rsi.toFixed(1)}) confirms bearish trend`);
  } else if (rsi > 70) {
    reasoning.push(`⚠️ RSI (${rsi.toFixed(1)}) overbought - potential pullback`);
    trendStrength -= 10;
  } else if (rsi < 30) {
    reasoning.push(`⚠️ RSI (${rsi.toFixed(1)}) oversold - potential bounce`);
    trendStrength -= 10;
  }

  // Volume Analysis
  if (volumeAnalysis.strength > 0.7 && volumeAnalysis.trend === 'increasing') {
    trendStrength += 15;
    reasoning.push(`✅ High volume (${volumeAnalysis.strength}%) confirms trend`);
  } else if (volumeAnalysis.strength < 0.3) {
    reasoning.push(`⚠️ Low volume (${volumeAnalysis.strength}%) - weak trend`);
    trendStrength -= 10;
  }

  // Cap trend strength
  trendStrength = Math.max(0, Math.min(100, trendStrength));

  // Determine suggestion
  let suggestion: 'buy_call' | 'buy_put' | 'wait' = 'wait';
  let confidence = trendStrength;

  if (trend === 'uptrend' && trendStrength > 50) {
    suggestion = 'buy_call';
    confidence = Math.min(90, trendStrength + 10);
    reasoning.push('📈 UPTREND DETECTED - Buy Call Options Recommended');
  } else if (trend === 'downtrend' && trendStrength > 50) {
    suggestion = 'buy_put';
    confidence = Math.min(90, trendStrength + 10);
    reasoning.push('📉 DOWNTREND DETECTED - Buy Put Options Recommended');
  } else {
    suggestion = 'wait';
    confidence = Math.max(30, trendStrength);
    reasoning.push('⏸️ SIDEWAYS/UNCLEAR - Wait for clearer signal');
  }

  // Calculate overnight gap (simulated - in real app, compare with pre-market data)
  const overnightGap = 0; // Would need pre-market data
  const gapPercent = 0;

  // Trading strategy
  const stopLossPercent = 1.5; // 1.5% stop loss
  const target1Percent = 2.5; // 2.5% target 1
  const target2Percent = 4.0; // 4.0% target 2

  let entryStrategy = '';
  let stopLoss = 0;
  let target1 = 0;
  let target2 = 0;

  if (suggestion === 'buy_call') {
    entryStrategy = `Buy Call at support level ${support1.toFixed(2)} or on breakout above ${resistance1.toFixed(2)}`;
    stopLoss = dayClose * (1 - stopLossPercent / 100);
    target1 = dayClose * (1 + target1Percent / 100);
    target2 = dayClose * (1 + target2Percent / 100);
  } else if (suggestion === 'buy_put') {
    entryStrategy = `Buy Put at resistance level ${resistance1.toFixed(2)} or on breakdown below ${support1.toFixed(2)}`;
    stopLoss = dayClose * (1 + stopLossPercent / 100);
    target1 = dayClose * (1 - target1Percent / 100);
    target2 = dayClose * (1 - target2Percent / 100);
  } else {
    entryStrategy = 'Wait for clear trend confirmation before entering';
    stopLoss = 0;
    target1 = 0;
    target2 = 0;
  }

  return {
    trend,
    trendStrength,
    suggestion,
    confidence,
    keyLevels: {
      support: support1,
      resistance: resistance1,
      pivot,
    },
    reasoning,
    preMarketAnalysis: {
      overnightGap,
      gapPercent,
      gapDirection: 'neutral',
    },
    tradingStrategy: {
      entryStrategy,
      stopLoss,
      target1,
      target2,
    },
  };
}

function getDefaultSetup(): MorningSetup {
  return {
    trend: 'sideways',
    trendStrength: 0,
    suggestion: 'wait',
    confidence: 0,
    keyLevels: {
      support: 0,
      resistance: 0,
      pivot: 0,
    },
    reasoning: ['Insufficient data for morning setup'],
    preMarketAnalysis: {
      overnightGap: 0,
      gapPercent: 0,
      gapDirection: 'neutral',
    },
    tradingStrategy: {
      entryStrategy: 'Wait for more data',
      stopLoss: 0,
      target1: 0,
      target2: 0,
    },
  };
}

// Export helper functions from prediction.ts
function calculateEMA(data: CandlestickData[], period: number): number {
  if (data.length < period) return data[data.length - 1].close;
  
  let ema = data.slice(0, period).reduce((sum, d) => sum + d.close, 0) / period;
  const multiplier = 2 / (period + 1);
  
  for (let i = period; i < data.length; i++) {
    ema = (data[i].close - ema) * multiplier + ema;
  }
  
  return ema;
}

function calculateRSI(data: CandlestickData[], period: number = 14): number {
  if (data.length < period + 1) return 50;
  
  const changes = [];
  for (let i = 1; i < data.length; i++) {
    changes.push(data[i].close - data[i - 1].close);
  }
  
  const recentChanges = changes.slice(-period);
  const gains = recentChanges.filter(c => c > 0);
  const losses = recentChanges.filter(c => c < 0).map(c => Math.abs(c));
  
  const avgGain = gains.length > 0 ? gains.reduce((a, b) => a + b, 0) / period : 0;
  const avgLoss = losses.length > 0 ? losses.reduce((a, b) => a + b, 0) / period : 0;
  
  if (avgLoss === 0) return 100;
  
  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
}

interface VolumeAnalysis {
  strength: number;
  trend: 'increasing' | 'decreasing' | 'neutral';
}

function analyzeVolume(data: CandlestickData[]): VolumeAnalysis {
  if (data.length < 10 || !data[0].volume) {
    return { strength: 0.5, trend: 'neutral' };
  }

  const volumes = data.map(d => d.volume || 0).filter(v => v > 0);
  if (volumes.length === 0) {
    return { strength: 0.5, trend: 'neutral' };
  }

  const avgVolume = volumes.reduce((a, b) => a + b, 0) / volumes.length;
  const recentVolumes = volumes.slice(-5);
  const recentAvg = recentVolumes.reduce((a, b) => a + b, 0) / recentVolumes.length;
  
  const volumeRatio = recentAvg / avgVolume;
  const strength = Math.min(1, Math.max(0, (volumeRatio - 0.5) * 2));
  
  const firstHalf = volumes.slice(0, Math.floor(volumes.length / 2));
  const secondHalf = volumes.slice(Math.floor(volumes.length / 2));
  const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
  
  let trend: 'increasing' | 'decreasing' | 'neutral' = 'neutral';
  const trendRatio = secondAvg / firstAvg;
  if (trendRatio > 1.1) {
    trend = 'increasing';
  } else if (trendRatio < 0.9) {
    trend = 'decreasing';
  }
  
  return { strength, trend };
}

