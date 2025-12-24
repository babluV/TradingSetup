import { OptionChainSummary, OptionLeg } from '@/types/optionChain';

/**
 * Generates mock option chain data for testing/fallback
 */
export function mockOptionChain(): OptionChainSummary {
  const currentPrice = 22000 + Math.random() * 2000 - 1000; // 21,000 to 23,000
  
  // Generate mock strikes around current price
  const strikes: number[] = [];
  const baseStrike = Math.round(currentPrice / 50) * 50; // Round to nearest 50
  
  for (let i = -10; i <= 10; i++) {
    strikes.push(baseStrike + (i * 50));
  }
  
  // Generate mock calls and puts
  const topCalls: OptionLeg[] = strikes
    .filter(s => s > currentPrice)
    .slice(0, 5)
    .map(strike => ({
      strikePrice: strike,
      openInterest: Math.floor(Math.random() * 1000000) + 100000,
      changeInOpenInterest: Math.floor(Math.random() * 100000) - 50000,
      volume: Math.floor(Math.random() * 500000) + 50000,
      ltp: Math.max(0, currentPrice - strike + Math.random() * 100),
    }));
  
  const topPuts: OptionLeg[] = strikes
    .filter(s => s < currentPrice)
    .slice(-5)
    .map(strike => ({
      strikePrice: strike,
      openInterest: Math.floor(Math.random() * 1000000) + 100000,
      changeInOpenInterest: Math.floor(Math.random() * 100000) - 50000,
      volume: Math.floor(Math.random() * 500000) + 50000,
      ltp: Math.max(0, strike - currentPrice + Math.random() * 100),
    }));
  
  // Calculate PCR (Put-Call Ratio)
  const totalPutOI = topPuts.reduce((sum, put) => sum + put.openInterest, 0);
  const totalCallOI = topCalls.reduce((sum, call) => sum + call.openInterest, 0);
  const pcrOI = totalCallOI > 0 ? totalPutOI / totalCallOI : 1;
  
  const totalPutVolume = topPuts.reduce((sum, put) => sum + put.volume, 0);
  const totalCallVolume = topCalls.reduce((sum, call) => sum + call.volume, 0);
  const pcrVolume = totalCallVolume > 0 ? totalPutVolume / totalCallVolume : 1;
  
  // Determine sentiment
  let sentiment: 'bullish' | 'bearish' | 'neutral' = 'neutral';
  if (pcrOI > 1.2) {
    sentiment = 'bearish'; // High PCR = more puts = bearish
  } else if (pcrOI < 0.8) {
    sentiment = 'bullish'; // Low PCR = more calls = bullish
  }
  
  // Calculate bullish strength (0-1)
  const bullishStrength = pcrOI < 1 ? 1 - (pcrOI * 0.5) : Math.max(0, 1 - (pcrOI - 1) * 0.5);
  
  return {
    timestamp: new Date().toISOString(),
    pcrOI,
    pcrVolume,
    bullishStrength: Math.max(0, Math.min(1, bullishStrength)),
    sentiment,
    topCalls,
    topPuts,
  };
}

/**
 * Summarizes raw option chain data into OptionChainSummary
 */
export function summarizeOptionChain(data: any[]): OptionChainSummary | null {
  if (!data || !Array.isArray(data) || data.length === 0) {
    return null;
  }
  
  try {
    // Extract calls and puts from the data
    const calls: OptionLeg[] = [];
    const puts: OptionLeg[] = [];
    
    // Process each option chain entry
    data.forEach((entry: any) => {
      // Handle different possible data structures
      const callData = entry.call || entry.CE || entry.callOption;
      const putData = entry.put || entry.PE || entry.putOption;
      
      if (callData) {
        calls.push({
          strikePrice: callData.strikePrice || callData.strike || entry.strikePrice || 0,
          openInterest: callData.openInterest || callData.OI || callData.oi || 0,
          changeInOpenInterest: callData.changeInOpenInterest || callData.changeInOI || callData.changeInOi || 0,
          volume: callData.volume || callData.vol || 0,
          ltp: callData.ltp || callData.lastPrice || callData.price || 0,
        });
      }
      
      if (putData) {
        puts.push({
          strikePrice: putData.strikePrice || putData.strike || entry.strikePrice || 0,
          openInterest: putData.openInterest || putData.OI || putData.oi || 0,
          changeInOpenInterest: putData.changeInOpenInterest || putData.changeInOI || putData.changeInOi || 0,
          volume: putData.volume || putData.vol || 0,
          ltp: putData.ltp || putData.lastPrice || putData.price || 0,
        });
      }
    });
    
    // Calculate totals
    const totalPutOI = puts.reduce((sum, put) => sum + put.openInterest, 0);
    const totalCallOI = calls.reduce((sum, call) => sum + call.openInterest, 0);
    const pcrOI = totalCallOI > 0 ? totalPutOI / totalCallOI : 1;
    
    const totalPutVolume = puts.reduce((sum, put) => sum + put.volume, 0);
    const totalCallVolume = calls.reduce((sum, call) => sum + call.volume, 0);
    const pcrVolume = totalCallVolume > 0 ? totalPutVolume / totalCallVolume : 1;
    
    // Determine sentiment
    let sentiment: 'bullish' | 'bearish' | 'neutral' = 'neutral';
    if (pcrOI > 1.2) {
      sentiment = 'bearish'; // High PCR = more puts = bearish
    } else if (pcrOI < 0.8) {
      sentiment = 'bullish'; // Low PCR = more calls = bullish
    }
    
    // Calculate bullish strength (0-1)
    const bullishStrength = pcrOI < 1 ? 1 - (pcrOI * 0.5) : Math.max(0, 1 - (pcrOI - 1) * 0.5);
    
    // Get top 5 calls and puts by open interest
    const topCalls = calls
      .filter(c => c.strikePrice > 0)
      .sort((a, b) => b.openInterest - a.openInterest)
      .slice(0, 5);
    
    const topPuts = puts
      .filter(p => p.strikePrice > 0)
      .sort((a, b) => b.openInterest - a.openInterest)
      .slice(0, 5);
    
    return {
      timestamp: new Date().toISOString(),
      pcrOI,
      pcrVolume,
      bullishStrength: Math.max(0, Math.min(1, bullishStrength)),
      sentiment,
      topCalls,
      topPuts,
    };
  } catch (error) {
    console.error('Error summarizing option chain:', error);
    return null;
  }
}
