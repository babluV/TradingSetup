export interface OptionLeg {
  strikePrice: number;
  openInterest: number;
  changeInOpenInterest: number;
  volume: number;
  ltp: number;
}

export interface OptionChainSummary {
  timestamp: string;
  pcrOI: number;
  pcrVolume: number;
  bullishStrength: number; // 0-1
  sentiment: 'bullish' | 'bearish' | 'neutral';
  topCalls: OptionLeg[];
  topPuts: OptionLeg[];
}








