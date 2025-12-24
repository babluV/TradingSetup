import { CandlestickData } from '@/types/trading';
import { generateMorningSetup, MorningSetup } from './morningSetup';

export interface TimeframeData {
  '15m': CandlestickData[];
  '1h': CandlestickData[];
  '1d': CandlestickData[];
}

/**
 * Analyzes multiple timeframes and combines them for morning setup
 */
export function analyzeMultiTimeframe(data15m: CandlestickData[], data1h: CandlestickData[], data1d: CandlestickData[]): MorningSetup {
  // Generate setup for each timeframe
  const setup15m = generateMorningSetup(data15m);
  const setup1h = generateMorningSetup(data1h);
  const setup1d = generateMorningSetup(data1d);

  // Combine analysis from all timeframes
  const timeframeAnalysis = {
    '15m': {
      trend: setup15m.trend,
      strength: setup15m.trendStrength,
      signal: getTimeframeSignal(setup15m),
    },
    '1h': {
      trend: setup1h.trend,
      strength: setup1h.trendStrength,
      signal: getTimeframeSignal(setup1h),
    },
    '1d': {
      trend: setup1d.trend,
      strength: setup1d.trendStrength,
      signal: getTimeframeSignal(setup1d),
    },
  };

  // Determine overall trend based on all timeframes
  // Weight: 1d (40%), 1h (35%), 15m (25%)
  const trendScores = {
    uptrend: 0,
    downtrend: 0,
    sideways: 0,
  };

  // 1 Day timeframe (most important for morning setup)
  if (setup1d.trend === 'uptrend') {
    trendScores.uptrend += setup1d.trendStrength * 0.4;
  } else if (setup1d.trend === 'downtrend') {
    trendScores.downtrend += setup1d.trendStrength * 0.4;
  } else {
    trendScores.sideways += setup1d.trendStrength * 0.4;
  }

  // 1 Hour timeframe
  if (setup1h.trend === 'uptrend') {
    trendScores.uptrend += setup1h.trendStrength * 0.35;
  } else if (setup1h.trend === 'downtrend') {
    trendScores.downtrend += setup1h.trendStrength * 0.35;
  } else {
    trendScores.sideways += setup1h.trendStrength * 0.35;
  }

  // 15 Minute timeframe
  if (setup15m.trend === 'uptrend') {
    trendScores.uptrend += setup15m.trendStrength * 0.25;
  } else if (setup15m.trend === 'downtrend') {
    trendScores.downtrend += setup15m.trendStrength * 0.25;
  } else {
    trendScores.sideways += setup15m.trendStrength * 0.25;
  }

  // Determine overall trend
  let overallTrend: 'uptrend' | 'downtrend' | 'sideways' = 'sideways';
  if (trendScores.uptrend > trendScores.downtrend && trendScores.uptrend > trendScores.sideways) {
    overallTrend = 'uptrend';
  } else if (trendScores.downtrend > trendScores.uptrend && trendScores.downtrend > trendScores.sideways) {
    overallTrend = 'downtrend';
  }

  // Calculate overall trend strength
  const overallTrendStrength = Math.min(100, Math.max(0, 
    overallTrend === 'uptrend' ? trendScores.uptrend :
    overallTrend === 'downtrend' ? trendScores.downtrend :
    trendScores.sideways
  ));

  // Calculate overall confidence (average of all timeframes)
  const overallConfidence = Math.min(100, Math.max(0, 
    (setup15m.confidence * 0.25 + setup1h.confidence * 0.35 + setup1d.confidence * 0.4)
  ));

  // Determine suggestion based on overall trend and confidence
  let suggestion: 'buy_call' | 'buy_put' | 'wait' = 'wait';
  const recommendations: string[] = [];

  // Add timeframe-specific recommendations
  recommendations.push(`📊 1 Day Trend: ${setup1d.trend.toUpperCase()} (${setup1d.trendStrength}% strength) - ${getTimeframeSignal(setup1d)}`);
  recommendations.push(`📊 1 Hour Trend: ${setup1h.trend.toUpperCase()} (${setup1h.trendStrength}% strength) - ${getTimeframeSignal(setup1h)}`);
  recommendations.push(`📊 15 Min Trend: ${setup15m.trend.toUpperCase()} (${setup15m.trendStrength}% strength) - ${getTimeframeSignal(setup15m)}`);

  // Check for alignment across timeframes
  const allUptrend = setup15m.trend === 'uptrend' && setup1h.trend === 'uptrend' && setup1d.trend === 'uptrend';
  const allDowntrend = setup15m.trend === 'downtrend' && setup1h.trend === 'downtrend' && setup1d.trend === 'downtrend';

  if (allUptrend && overallConfidence > 65) {
    suggestion = 'buy_call';
    recommendations.push('✅✅✅ STRONG BUY CALL: All timeframes aligned in UPTREND');
    recommendations.push('🎯 High probability setup - All timeframes confirm bullish momentum');
  } else if (allDowntrend && overallConfidence > 65) {
    suggestion = 'buy_put';
    recommendations.push('✅✅✅ STRONG BUY PUT: All timeframes aligned in DOWNTREND');
    recommendations.push('🎯 High probability setup - All timeframes confirm bearish momentum');
  } else if (overallTrend === 'uptrend' && overallConfidence > 60) {
    suggestion = 'buy_call';
    recommendations.push('✅ BUY CALL: Overall trend is UPTREND across multiple timeframes');
  } else if (overallTrend === 'downtrend' && overallConfidence > 60) {
    suggestion = 'buy_put';
    recommendations.push('✅ BUY PUT: Overall trend is DOWNTREND across multiple timeframes');
  } else {
    suggestion = 'wait';
    recommendations.push('⚠️ WAIT: Mixed signals across timeframes - Wait for clearer direction');
    recommendations.push('💡 Monitor for alignment - Trade when 2+ timeframes align');
  }

  // Add original recommendations from 1d timeframe (most important)
  setup1d.recommendations.forEach(rec => {
    if (!recommendations.includes(rec)) {
      recommendations.push(rec);
    }
  });

  // Determine risk level
  let riskLevel: 'low' | 'medium' | 'high' = 'medium';
  if (allUptrend || allDowntrend) {
    riskLevel = 'low';
  } else if (overallConfidence < 50) {
    riskLevel = 'high';
  }

  // Use key levels from 1d timeframe (most reliable)
  return {
    trend: overallTrend,
    trendStrength: Math.round(overallTrendStrength),
    suggestion,
    confidence: Math.round(overallConfidence),
    keyLevels: setup1d.keyLevels,
    analysis: {
      emaSignal: `Multi-Timeframe: ${setup1d.analysis.emaSignal}`,
      rsiSignal: `15m:${setup15m.analysis.rsiSignal} | 1h:${setup1h.analysis.rsiSignal} | 1d:${setup1d.analysis.rsiSignal}`,
      volumeSignal: setup1d.analysis.volumeSignal,
      priceAction: setup1d.analysis.priceAction,
    },
    recommendations,
    riskLevel,
    timeframeAnalysis,
  };
}

function getTimeframeSignal(setup: MorningSetup): string {
  if (setup.suggestion === 'buy_call') {
    return '🟢 BUY CALL';
  } else if (setup.suggestion === 'buy_put') {
    return '🔴 BUY PUT';
  }
  return '🟡 WAIT';
}










