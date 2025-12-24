export interface CandlestickData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

export interface SupportResistanceLevel {
  price: number;
  type: 'support' | 'resistance';
  strength: number; // 0-1, higher is stronger
  touches: number; // number of times price touched this level
}

export interface OptionTrade {
  id: string;
  type: 'call' | 'put';
  strikePrice: number;
  entryPrice: number;
  quantity: number;
  entryTime: Date;
  currentPrice?: number;
  profitLoss?: number;
  status: 'open' | 'closed';
}

export interface TradingSignal {
  type: 'buy_call' | 'buy_put';
  price: number;
  level: SupportResistanceLevel;
  timestamp: Date;
  confidence: number;
}










