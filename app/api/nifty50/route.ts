import { NextResponse } from 'next/server';

/**
 * Fetches Nifty 50 data from Yahoo Finance API
 * Fallback to mock data if API fails
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const interval = searchParams.get('interval') || '1m'; // 1m, 5m, 15m, 1h, 1d
    const range = searchParams.get('range') || '1d'; // 1d, 5d, 1mo, etc.

    // Yahoo Finance API endpoint for Nifty 50
    // Nifty 50 symbol: ^NSEI
    const symbol = '^NSEI';
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=${interval}&range=${range}`;

    // Add timeout to fetch request
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000); // 4 second timeout

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
      },
      signal: controller.signal,
      next: { revalidate: 0 }, // No cache - always fetch fresh data
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error('Failed to fetch data');
    }

    const data = await response.json();
    
    if (!data.chart || !data.chart.result || data.chart.result.length === 0) {
      throw new Error('No data available');
    }

    const result = data.chart.result[0];
    const timestamps = result.timestamp;
    const quotes = result.indicators.quote[0];

    // Convert to candlestick format and align timestamps to proper intervals
    const rawCandlestickData = timestamps.map((timestamp: number, index: number) => {
      // For 5-minute intervals, align to 5-minute boundaries (e.g., 9:15, 9:20, 9:25)
      let alignedTimestamp = timestamp;
      if (interval === '5m') {
        const date = new Date(timestamp * 1000);
        const minutes = date.getMinutes();
        // Round down to nearest 5-minute boundary (0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55)
        const alignedMinutes = Math.floor(minutes / 5) * 5;
        date.setMinutes(alignedMinutes, 0, 0);
        alignedTimestamp = Math.floor(date.getTime() / 1000);
      }
      
      const open = quotes.open[index] || 0;
      const high = quotes.high[index] || 0;
      const low = quotes.low[index] || 0;
      const close = quotes.close[index] || 0;
      
      // Validate OHLC data integrity
      if (open <= 0 || close <= 0 || high <= 0 || low <= 0) {
        return null; // Skip invalid data
      }
      
      // Ensure high >= max(open, close) and low <= min(open, close)
      const maxPrice = Math.max(open, close);
      const minPrice = Math.min(open, close);
      const validHigh = Math.max(high, maxPrice);
      const validLow = Math.min(low, minPrice);
      
      // Additional validation: high should be >= low
      if (validHigh < validLow) {
        return null; // Skip invalid data
      }
      
      return {
        time: alignedTimestamp,
        open: Number(open.toFixed(2)),
        high: Number(validHigh.toFixed(2)),
        low: Number(validLow.toFixed(2)),
        close: Number(close.toFixed(2)),
        volume: quotes.volume[index] || 0,
      };
    }).filter((item: any) => item !== null);
    
    // Group by timestamp and aggregate for 5-minute intervals
    const timeMap = new Map<number, any>();
    
    rawCandlestickData.forEach((item: any) => {
      if (!item) return;
      
      const existing = timeMap.get(item.time);
      if (!existing) {
        timeMap.set(item.time, { ...item });
      } else {
        // Aggregate: use first open, last close, max high, min low, sum volume
        existing.open = existing.open; // Keep first open
        existing.high = Math.max(existing.high, item.high);
        existing.low = Math.min(existing.low, item.low);
        existing.close = item.close; // Use latest close
        existing.volume = (existing.volume || 0) + (item.volume || 0);
      }
    });
    
    // Convert map to array, sort by time, and ensure data integrity
    const uniqueData = Array.from(timeMap.values())
      .map((item: any) => {
        // Final validation: ensure high >= max(open, close) and low <= min(open, close)
        const maxPrice = Math.max(item.open, item.close);
        const minPrice = Math.min(item.open, item.close);
        item.high = Math.max(item.high, maxPrice);
        item.low = Math.min(item.low, minPrice);
        
        // Ensure high >= low
        if (item.high < item.low) {
          item.high = maxPrice;
          item.low = minPrice;
        }
        
        // Validate range is not too wide (more than 5% of average price is suspicious for 5-min data)
        const avgPrice = (item.open + item.close) / 2;
        const priceRange = item.high - item.low;
        const rangePercent = (priceRange / avgPrice) * 100;
        
        // If range is more than 5% of price, cap it to reasonable value
        if (rangePercent > 5) {
          const maxRange = avgPrice * 0.05; // 5% max range
          const center = (item.high + item.low) / 2;
          item.high = center + maxRange / 2;
          item.low = center - maxRange / 2;
          // Re-validate after capping
          item.high = Math.max(item.high, maxPrice);
          item.low = Math.min(item.low, minPrice);
        }
        
        return item;
      })
      .filter((item: any) => {
        // Final filter: ensure all values are valid
        if (!(item.time > 0 && 
               item.open > 0 && 
               item.close > 0 && 
               item.high > 0 && 
               item.low > 0 &&
               item.high >= item.low &&
               item.high >= Math.max(item.open, item.close) &&
               item.low <= Math.min(item.open, item.close))) {
          return false;
        }
        
        // Additional validation: range should be reasonable
        const avgPrice = (item.open + item.close) / 2;
        const priceRange = item.high - item.low;
        const rangePercent = (priceRange / avgPrice) * 100;
        
        // Filter out candles with more than 10% range (likely data error)
        if (rangePercent > 10) {
          return false;
        }
        
        return true;
      })
      .sort((a, b) => a.time - b.time); // Ensure chronological order

    return NextResponse.json({
      success: true,
      data: uniqueData,
      currentPrice: uniqueData.length > 0 ? uniqueData[uniqueData.length - 1].close : 0,
    });
  } catch (error) {
    console.error('Error fetching Nifty 50 data:', error);
    
    // Return error but don't fail - client will use fallback
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      data: [],
      currentPrice: 0,
    }, { status: 200 }); // Return 200 so client can handle fallback
  }
}

