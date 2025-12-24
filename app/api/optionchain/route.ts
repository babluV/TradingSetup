import { NextResponse } from 'next/server';
import { mockOptionChain } from '@/utils/optionChain';

/**
 * Fetches Nifty 50 option chain data
 * Currently returns mock data as free option chain APIs are limited
 * In production, this would connect to a paid API service
 */
export async function GET(request: Request) {
  try {
    // Option chain data is typically available from:
    // 1. NSE official API (requires authentication)
    // 2. Third-party services like Alpha Vantage, Polygon.io (paid)
    // 3. Web scraping (not recommended for production)
    
    // For now, return mock data that simulates real option chain structure
    // In a production environment, you would:
    // 1. Authenticate with NSE API
    // 2. Fetch real-time option chain data
    // 3. Parse and format the response
    
    const mockData = mockOptionChain();
    
    // Convert mock data to API response format
    // Real option chain data would have this structure:
    const optionChainData = [
      // Calls (CE)
      ...mockData.topCalls.map(call => ({
        strikePrice: call.strikePrice,
        call: {
          strikePrice: call.strikePrice,
          openInterest: call.openInterest,
          changeInOpenInterest: call.changeInOpenInterest,
          volume: call.volume,
          ltp: call.ltp,
        },
        put: null, // Would have corresponding put data in real API
      })),
      // Puts (PE)
      ...mockData.topPuts.map(put => ({
        strikePrice: put.strikePrice,
        call: null, // Would have corresponding call data in real API
        put: {
          strikePrice: put.strikePrice,
          openInterest: put.openInterest,
          changeInOpenInterest: put.changeInOpenInterest,
          volume: put.volume,
          ltp: put.ltp,
        },
      })),
    ];
    
    return NextResponse.json({
      success: true,
      data: optionChainData,
      summary: {
        pcrOI: mockData.pcrOI,
        pcrVolume: mockData.pcrVolume,
        sentiment: mockData.sentiment,
        timestamp: mockData.timestamp,
      },
      source: 'mock', // Would be 'nse' or 'api' in production
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error) {
    console.error('Error fetching option chain:', error);
    
    // Return empty data on error
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      data: [],
      summary: null,
      source: 'error',
    }, { 
      status: 200, // Return 200 to prevent frontend errors
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  }
}
