import { CandlestickData } from '@/types/trading';
import { OptionChainSummary } from '@/types/optionChain';
import { GlobalMarketData } from '@/types/marketData';

export interface Prediction {
  nextDayPrice: number;
  confidence: number;
  direction: 'up' | 'down' | 'neutral';
  supportLevel: number;
  resistanceLevel: number;
  reasoning: string[];
  indicators: {
    ema9: number;
    ema21: number;
    ema50: number;
    rsi: number;
    volumeStrength: number;
    volumeTrend: 'increasing' | 'decreasing' | 'neutral';
  };
}

export interface NextDayPrediction {
  direction: 'BULLISH' | 'BEARISH' | 'NEUTRAL' | 'up' | 'down' | 'neutral';
  confidence: number;
  currentPrice: number;
  predictedPrice: number;
  supportLevel: number;
  resistanceLevel: number;
  orderRecommendations?: {
    type: 'PUT' | 'CALL';
    putStrike?: number;
    callStrike?: number;
    entryLevel: number;
    stopLoss: number;
    target: number;
  };
  analysis?: {
    globalMarkets?: {
      commodities?: {
        gold?: { impact: 'bullish' | 'bearish' | 'neutral' };
        crudeOil?: { impact: 'bullish' | 'bearish' | 'neutral' };
      };
      fiiDii?: { impact: 'bullish' | 'bearish' | 'neutral' };
    };
  };
}

/**
 * Predicts next day price based on technical analysis
 */
export function predictNextDay(data: CandlestickData[]): Prediction {
  if (data.length === 0) {
    return {
      nextDayPrice: 0,
      confidence: 0,
      direction: 'neutral',
      supportLevel: 0,
      resistanceLevel: 0,
      reasoning: ['Insufficient data'],
      indicators: {
        ema9: 0,
        ema21: 0,
        ema50: 0,
        rsi: 50,
        volumeStrength: 0,
        volumeTrend: 'neutral',
      },
    };
  }

  const recent = data.slice(-20);
  const currentPrice = data[data.length - 1].close;

  // Calculate EMAs
  const calculateEMA = (period: number): number => {
    const multiplier = 2 / (period + 1);
    let ema = recent[0].close;
    for (let i = 1; i < recent.length; i++) {
      ema = (recent[i].close * multiplier) + (ema * (1 - multiplier));
    }
    return ema;
  };

  const ema9 = calculateEMA(9);
  const ema21 = calculateEMA(21);
  const ema50 = calculateEMA(50);

  // Calculate RSI
  const calculateRSI = (period: number = 14): number => {
    if (recent.length < period + 1) return 50;
    
    let gains = 0;
    let losses = 0;
    
    for (let i = recent.length - period; i < recent.length; i++) {
      const change = recent[i].close - recent[i - 1].close;
      if (change > 0) gains += change;
      else losses += Math.abs(change);
    }
    
    const avgGain = gains / period;
    const avgLoss = losses / period;
    
    if (avgLoss === 0) return 100;
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
  };

  const rsi = calculateRSI();

  // Calculate volume strength
  const volumes = recent.map(d => d.volume || 0);
  const avgVolume = volumes.reduce((a, b) => a + b, 0) / volumes.length;
  const recentVolume = volumes[volumes.length - 1] || 0;
  const volumeStrength = avgVolume > 0 ? Math.min(100, (recentVolume / avgVolume) * 100) : 0;
  const volumeTrend: 'increasing' | 'decreasing' | 'neutral' = 
    recentVolume > avgVolume * 1.2 ? 'increasing' :
    recentVolume < avgVolume * 0.8 ? 'decreasing' : 'neutral';

  // Determine direction
  let direction: 'up' | 'down' | 'neutral' = 'neutral';
  let confidence = 50;
  const reasoning: string[] = [];

  // EMA alignment
  if (ema9 > ema21 && ema21 > ema50) {
    direction = 'up';
    confidence += 20;
    reasoning.push('Bullish EMA alignment (9 > 21 > 50)');
  } else if (ema9 < ema21 && ema21 < ema50) {
    direction = 'down';
    confidence += 20;
    reasoning.push('Bearish EMA alignment (9 < 21 < 50)');
  }

  // RSI signals
  if (rsi < 30) {
    direction = 'up';
    confidence += 15;
    reasoning.push('RSI indicates oversold condition');
  } else if (rsi > 70) {
    direction = 'down';
    confidence += 15;
    reasoning.push('RSI indicates overbought condition');
  }

  // Price momentum
  const priceChange = currentPrice - recent[0].close;
  const priceChangePercent = (priceChange / recent[0].close) * 100;
  
  if (priceChangePercent > 1) {
    direction = 'up';
    confidence += 10;
    reasoning.push('Strong upward momentum');
  } else if (priceChangePercent < -1) {
    direction = 'down';
    confidence += 10;
    reasoning.push('Strong downward momentum');
  }

  // Volume confirmation
  if (volumeTrend === 'increasing' && direction !== 'neutral') {
    confidence += 10;
    reasoning.push('Volume confirms trend');
  }

  confidence = Math.min(95, Math.max(5, confidence));

  // Calculate predicted price
  const momentum = priceChangePercent / 100;
  const predictedPrice = currentPrice * (1 + momentum * 0.5);

  // Calculate support and resistance
  const highs = recent.map(d => d.high);
  const lows = recent.map(d => d.low);
  const resistanceLevel = Math.max(...highs);
  const supportLevel = Math.min(...lows);

  return {
    nextDayPrice: predictedPrice,
    confidence,
    direction,
    supportLevel,
    resistanceLevel,
    reasoning: reasoning.length > 0 ? reasoning : ['Neutral market conditions'],
    indicators: {
      ema9,
      ema21,
      ema50,
      rsi,
      volumeStrength,
      volumeTrend,
    },
  };
}

/**
 * Enhanced prediction with option chain and global market data
 */
export function predictNextDayWithOptionChain(
  data: CandlestickData[],
  optionChain: OptionChainSummary | null,
  globalMarkets: GlobalMarketData | null
): NextDayPrediction {
  const basePrediction = predictNextDay(data);
  const currentPrice = data.length > 0 ? data[data.length - 1].close : 0;

  // Convert direction to uppercase format
  let direction: 'BULLISH' | 'BEARISH' | 'NEUTRAL' = 'NEUTRAL';
  if (basePrediction.direction === 'up') direction = 'BULLISH';
  else if (basePrediction.direction === 'down') direction = 'BEARISH';

  let confidence = basePrediction.confidence;
  const reasoning: string[] = [...basePrediction.reasoning];

  // Adjust based on option chain
  if (optionChain) {
    if (optionChain.sentiment === 'bullish') {
      confidence += 5;
      reasoning.push('Option chain shows bullish sentiment');
    } else if (optionChain.sentiment === 'bearish') {
      confidence += 5;
      reasoning.push('Option chain shows bearish sentiment');
    }

    // PCR analysis
    if (optionChain.pcrOI > 1.2) {
      confidence += 3;
      reasoning.push('High Put-Call Ratio (OI) indicates support');
    } else if (optionChain.pcrOI < 0.8) {
      confidence += 3;
      reasoning.push('Low Put-Call Ratio (OI) indicates resistance');
    }
  }

  // Adjust based on global markets
  const analysis: NextDayPrediction['analysis'] = {
    globalMarkets: {},
  };

  if (globalMarkets) {
    // Gold impact
    if (globalMarkets.commodities?.gold) {
      const goldChange = globalMarkets.commodities.gold.changePercent || 0;
      if (goldChange > 1) {
        analysis.globalMarkets!.commodities = {
          ...analysis.globalMarkets!.commodities,
          gold: { impact: 'bearish' },
        };
        reasoning.push('Gold rising indicates risk-off sentiment');
      } else if (goldChange < -1) {
        analysis.globalMarkets!.commodities = {
          ...analysis.globalMarkets!.commodities,
          gold: { impact: 'bullish' },
        };
        reasoning.push('Gold falling indicates risk-on sentiment');
      } else {
        analysis.globalMarkets!.commodities = {
          ...analysis.globalMarkets!.commodities,
          gold: { impact: 'neutral' },
        };
      }
    }

    // Crude Oil impact
    if (globalMarkets.commodities?.crudeOil) {
      const oilChange = globalMarkets.commodities.crudeOil.changePercent || 0;
      if (oilChange > 2) {
        analysis.globalMarkets!.commodities = {
          ...analysis.globalMarkets!.commodities,
          crudeOil: { impact: 'bearish' },
        };
        reasoning.push('Crude oil rising is negative for Indian markets');
      } else if (oilChange < -2) {
        analysis.globalMarkets!.commodities = {
          ...analysis.globalMarkets!.commodities,
          crudeOil: { impact: 'bullish' },
        };
        reasoning.push('Crude oil falling is positive for Indian markets');
      } else {
        analysis.globalMarkets!.commodities = {
          ...analysis.globalMarkets!.commodities,
          crudeOil: { impact: 'neutral' },
        };
      }
    }

    // FII/DII impact
    if (globalMarkets.fiiDii) {
      const netFII = globalMarkets.fiiDii.netFII || 0;
      if (netFII > 500) {
        analysis.globalMarkets!.fiiDii = { impact: 'bullish' };
        confidence += 5;
        reasoning.push('Strong FII buying activity');
      } else if (netFII < -500) {
        analysis.globalMarkets!.fiiDii = { impact: 'bearish' };
        confidence += 5;
        reasoning.push('Strong FII selling activity');
      } else {
        analysis.globalMarkets!.fiiDii = { impact: 'neutral' };
      }
    }
  }

  confidence = Math.min(95, Math.max(5, confidence));

  // Calculate order recommendations
  const orderRecommendations: NextDayPrediction['orderRecommendations'] = {
    type: direction === 'BULLISH' ? 'CALL' : 'PUT',
    entryLevel: currentPrice,
    stopLoss: direction === 'BULLISH' 
      ? currentPrice * 0.98 
      : currentPrice * 1.02,
    target: direction === 'BULLISH'
      ? currentPrice * 1.02
      : currentPrice * 0.98,
  };

  if (direction === 'BULLISH') {
    orderRecommendations.callStrike = Math.round(currentPrice * 1.01);
  } else if (direction === 'BEARISH') {
    orderRecommendations.putStrike = Math.round(currentPrice * 0.99);
  }

  return {
    direction,
    confidence,
    currentPrice,
    predictedPrice: basePrediction.nextDayPrice,
    supportLevel: basePrediction.supportLevel,
    resistanceLevel: basePrediction.resistanceLevel,
    orderRecommendations,
    analysis,
  };
}
