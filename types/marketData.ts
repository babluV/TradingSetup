export interface CommodityData {
  name: string;
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  timestamp: string;
}

export interface FIIDIIData {
  date: string;
  fii: {
    equity: number;
    debt: number;
    total: number;
  };
  dii: {
    equity: number;
    debt: number;
    total: number;
  };
  netFII: number;
}

export interface GlobalMarketData {
  commodities: {
    gold?: CommodityData;
    crudeOil?: CommodityData;
  };
  indices: Record<string, unknown>;
  fiiDii: FIIDIIData;
}

