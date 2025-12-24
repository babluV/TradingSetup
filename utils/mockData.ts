import { CandlestickData } from '@/types/trading';

/**
 * Generates mock candlestick data for Nifty 50
 * Nifty 50 typically trades in the range of 20,000 - 25,000
 */
export function generateNifty50Data(periods: number = 100, intervalMinutes: number = 1): CandlestickData[] {
  const data: CandlestickData[] = [];
  // Start with a realistic Nifty 50 base price (around 22,000)
  let basePrice = 22000 + (Math.random() * 2000 - 1000); // 21,000 to 23,000
  
  // Get current UTC time and align to the most recent completed interval boundary
  const now = new Date();
  
  // Align to the most recent completed interval boundary in UTC
  let alignedTime: Date;
  
  if (intervalMinutes >= 1440) {
    // Daily intervals - align to today's midnight UTC (most recent completed day)
    alignedTime = new Date(Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
      0, 0, 0, 0
    ));
  } else if (intervalMinutes >= 60) {
    // Hourly intervals - align to the most recent completed interval
    const hours = Math.floor(intervalMinutes / 60);
    const currentHour = now.getUTCHours();
    const currentMinutes = now.getUTCMinutes();
    // Find the most recent completed hour interval
    // For 1-hour: 0, 1, 2, 3... (every hour)
    // For 4-hour: 0, 4, 8, 12, 16, 20 (every 4 hours)
    const completedHour = Math.floor(currentHour / hours) * hours;
    alignedTime = new Date(Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
      completedHour,
      0, 0, 0
    ));
  } else {
    // Minute intervals - align to the most recent completed interval
    // For 5-minute intervals, align to boundaries: 0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55
    const currentMinutes = now.getUTCMinutes();
    const completedMinutes = Math.floor(currentMinutes / intervalMinutes) * intervalMinutes;
    alignedTime = new Date(Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
      now.getUTCHours(),
      completedMinutes,
      0, 0
    ));
  }
  
  // Calculate start time
  // The last candle should be at alignedTime (most recent completed interval)
  // So we go back (periods - 1) intervals to get the start
  const startTime = alignedTime.getTime() - (periods - 1) * intervalMinutes * 60 * 1000;

  for (let i = 0; i < periods; i++) {
    const time = startTime + i * intervalMinutes * 60 * 1000;
    // Nifty 50 typically has volatility of 0.3-0.8% per candle
    const volatility = 0.3 + Math.random() * 0.5;
    const trend = Math.sin(i / 15) * 0.2; // Longer cycles
    const randomWalk = (Math.random() - 0.5) * volatility;
    
    // Nifty 50 moves in smaller percentages
    basePrice = basePrice * (1 + trend * 0.005 + randomWalk * 0.005);
    
    // Ensure price stays in realistic Nifty 50 range
    basePrice = Math.max(19500, Math.min(25500, basePrice));
    
    const open = basePrice;
    // Nifty 50 intraday moves are typically 0.5-1.5%
    const priceChange = (Math.random() - 0.5) * 0.015;
    const close = open * (1 + priceChange);
    
    // Ensure high >= max(open, close) and low <= min(open, close)
    const maxPrice = Math.max(open, close);
    const minPrice = Math.min(open, close);
    
    // Generate high and low with proper validation
    const highWick = Math.random() * 0.008; // 0-0.8% wick above
    const lowWick = Math.random() * 0.008; // 0-0.8% wick below
    const high = maxPrice * (1 + highWick);
    const low = minPrice * (1 - lowWick);
    
    // Final validation: ensure high >= low and proper OHLC relationships
    const validHigh = Math.max(high, maxPrice);
    const validLow = Math.min(low, minPrice);
    
    // Nifty 50 volume is typically in crores (10s of millions)
    const volume = Math.floor(Math.random() * 50000000) + 10000000; // 1-5 crores

    // Only add if data is valid
    if (validHigh >= validLow && validHigh >= maxPrice && validLow <= minPrice) {
    data.push({
      time: Math.floor(time / 1000), // Convert to seconds
      open: Number(open.toFixed(2)),
        high: Number(validHigh.toFixed(2)),
        low: Number(validLow.toFixed(2)),
      close: Number(close.toFixed(2)),
      volume,
    });
    }
  }

  return data;
}

/**
 * Legacy function for backward compatibility
 */
export function generateMockData(periods: number = 100, intervalMinutes: number = 1): CandlestickData[] {
  return generateNifty50Data(periods, intervalMinutes);
}

