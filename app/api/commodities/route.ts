import { NextResponse } from 'next/server';

/**
 * Fetches commodities data (Gold, Crude Oil) from Yahoo Finance API
 */
export async function GET(request: Request) {
  try {
    // Fetch Gold and Crude Oil prices from Yahoo Finance
    const goldSymbol = 'GC=F'; // Gold futures
    const crudeOilSymbol = 'CL=F'; // Crude Oil futures
    
    const [goldResponse, crudeOilResponse] = await Promise.all([
      fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${goldSymbol}?interval=1d&range=1d`, {
        headers: { 'User-Agent': 'Mozilla/5.0' },
        next: { revalidate: 60 },
      }).catch(() => null),
      fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${crudeOilSymbol}?interval=1d&range=1d`, {
        headers: { 'User-Agent': 'Mozilla/5.0' },
        next: { revalidate: 60 },
      }).catch(() => null),
    ]);
    
    let goldData = null;
    let crudeOilData = null;
    
    // Parse Gold data
    if (goldResponse?.ok) {
      try {
        const goldJson = await goldResponse.json();
        if (goldJson.chart?.result?.[0]) {
          const result = goldJson.chart.result[0];
          const quote = result.indicators?.quote?.[0];
          const currentPrice = quote?.close?.[quote.close.length - 1] || 0;
          const previousClose = result.meta?.previousClose || currentPrice;
          const change = currentPrice - previousClose;
          const changePercent = previousClose > 0 ? (change / previousClose) * 100 : 0;
          
          goldData = {
            name: 'Gold',
            symbol: goldSymbol,
            price: currentPrice,
            change: change,
            changePercent: changePercent,
            timestamp: new Date().toISOString(),
          };
        }
      } catch (error) {
        console.error('Error parsing gold data:', error);
      }
    }
    
    // Parse Crude Oil data
    if (crudeOilResponse?.ok) {
      try {
        const crudeOilJson = await crudeOilResponse.json();
        if (crudeOilJson.chart?.result?.[0]) {
          const result = crudeOilJson.chart.result[0];
          const quote = result.indicators?.quote?.[0];
          const currentPrice = quote?.close?.[quote.close.length - 1] || 0;
          const previousClose = result.meta?.previousClose || currentPrice;
          const change = currentPrice - previousClose;
          const changePercent = previousClose > 0 ? (change / previousClose) * 100 : 0;
          
          crudeOilData = {
            name: 'Crude Oil',
            symbol: crudeOilSymbol,
            price: currentPrice,
            change: change,
            changePercent: changePercent,
            timestamp: new Date().toISOString(),
          };
        }
      } catch (error) {
        console.error('Error parsing crude oil data:', error);
      }
    }
    
    // Fallback to mock data if API fails
    if (!goldData) {
      goldData = {
        name: 'Gold',
        symbol: goldSymbol,
        price: 2650.50,
        change: -5.20,
        changePercent: -0.20,
        timestamp: new Date().toISOString(),
      };
    }
    
    if (!crudeOilData) {
      crudeOilData = {
        name: 'Crude Oil',
        symbol: crudeOilSymbol,
        price: 78.45,
        change: 0.85,
        changePercent: 1.10,
        timestamp: new Date().toISOString(),
      };
    }
    
    return NextResponse.json({
      success: true,
      data: {
        gold: goldData,
        crudeOil: crudeOilData,
      },
    });
  } catch (error) {
    console.error('Error fetching commodities data:', error);
    
    // Return fallback data
    return NextResponse.json({
      success: false,
      data: {
        gold: {
          name: 'Gold',
          symbol: 'GC=F',
          price: 2650.50,
          change: -5.20,
          changePercent: -0.20,
          timestamp: new Date().toISOString(),
        },
        crudeOil: {
          name: 'Crude Oil',
          symbol: 'CL=F',
          price: 78.45,
          change: 0.85,
          changePercent: 1.10,
          timestamp: new Date().toISOString(),
        },
      },
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 200 });
  }
}

