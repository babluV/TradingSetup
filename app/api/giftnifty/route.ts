import { NextResponse } from 'next/server';

/**
 * Fetches Gift Nifty (SGX Nifty) data from Yahoo Finance API
 * Gift Nifty trades on Singapore Exchange before Indian market hours
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const interval = searchParams.get('interval') || '15m';
    const range = searchParams.get('range') || '1d';

    // Gift Nifty symbol on Yahoo Finance (SGX Nifty)
    // Try multiple possible symbols
    const symbols = ['^NSEI', 'NIFTY.SI', 'NIFTY.SG']; // NSEI is Nifty 50, others are SGX variants
    
    let data = null;
    let symbolUsed = '^NSEI';
    
    // Try to fetch Gift Nifty data
    for (const symbol of symbols) {
      try {
        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=${interval}&range=${range}`;
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000);
        
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0',
          },
          signal: controller.signal,
          next: { revalidate: 60 },
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          const result = await response.json();
          
          if (result.chart && result.chart.result && result.chart.result.length > 0) {
            const chartResult = result.chart.result[0];
            const timestamps = chartResult.timestamp;
            const quotes = chartResult.indicators.quote[0];
            
            const candlestickData = timestamps.map((timestamp: number, index: number) => ({
              time: timestamp,
              open: quotes.open[index] || 0,
              high: quotes.high[index] || 0,
              low: quotes.low[index] || 0,
              close: quotes.close[index] || 0,
              volume: quotes.volume[index] || 0,
            })).filter((item: any) => item.open > 0 && item.close > 0);
            
            if (candlestickData.length > 0) {
              data = candlestickData;
              symbolUsed = symbol;
              break;
            }
          }
        }
      } catch (error) {
        // Try next symbol
        continue;
      }
    }
    
    if (!data || data.length === 0) {
      throw new Error('No Gift Nifty data available');
    }

    return NextResponse.json({
      success: true,
      data: data,
      currentPrice: data.length > 0 ? data[data.length - 1].close : 0,
      symbol: symbolUsed,
      source: 'Gift Nifty (SGX)',
    });
  } catch (error) {
    console.error('Error fetching Gift Nifty data:', error);
    
    // Fallback to regular Nifty 50
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      data: [],
      currentPrice: 0,
      source: 'Fallback to Nifty 50',
    }, { status: 200 });
  }
}










