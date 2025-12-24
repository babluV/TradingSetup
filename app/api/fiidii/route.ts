import { NextResponse } from 'next/server';
import { FIIDIIData } from '@/types/marketData';

/**
 * Fetches FII (Foreign Institutional Investors) and DII (Domestic Institutional Investors) data
 * Note: This is a placeholder - real FII/DII data typically comes from NSE/BSE APIs
 * For production, integrate with official NSE API or financial data providers
 */
export async function GET(request: Request) {
  try {
    // In production, fetch from NSE API or financial data provider
    // Example: https://www.nseindia.com/api/fiidii-trade-data
    // For now, we'll use mock data with realistic patterns
    
    // Use today's date in IST for FII/DII data
    // This makes the date line up with what you see on NSE
    const now = new Date();
    const istString = now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' });
    const istDate = new Date(istString);
    // Build YYYY-MM-DD based on IST calendar date (no UTC shift)
    const dateString = [
      istDate.getFullYear(),
      String(istDate.getMonth() + 1).padStart(2, '0'),
      String(istDate.getDate()).padStart(2, '0'),
    ].join('-');
    
    // Create a seed based on the date string (YYYY-MM-DD) and current hour
    // This ensures data is consistent for the same hour but updates hourly
    const currentHour = istDate.getHours();
    const seed = dateString.split('').reduce((acc, char) => {
      if (char >= '0' && char <= '9') {
        return acc + parseInt(char);
      }
      return acc;
    }, 0) + currentHour; // Add hour to seed for hourly updates
    
    // Improved seeded random number generator for better distribution
    const seededRandom = (seed: number) => {
      // Use a better seed algorithm for more consistent results
      let hash = seed;
      hash = ((hash << 5) - hash) + seed;
      hash = hash & hash; // Convert to 32bit integer
      const x = Math.sin(hash) * 10000;
      return Math.abs(x - Math.floor(x));
    };
    
    // Generate consistent values based on date seed
    // Use different seed values for each random number to ensure variety
    const random1 = seededRandom(seed * 1.1);
    const random2 = seededRandom(seed * 1.2);
    const random3 = seededRandom(seed * 1.3);
    const random4 = seededRandom(seed * 1.4);
    let currentSeed = seed * 1.5;

    // Mock FII/DII data (realistic ranges)
    // FII typically trades in range: -2000 to +3000 crores
    // DII typically trades in range: -1500 to +2500 crores
    // Note: FII and DII often move in opposite directions
    // When FII is buying, DII might be selling and vice versa
    const baseFII = random1 * 5000 - 2000; // -2000 to +3000
    const mockFIIEquity = Math.round(baseFII * 100) / 100;
    
    // DII often counters FII - if FII is buying heavily, DII might sell
    // If FII is selling heavily, DII might buy (supporting the market)
    let mockDIIEquity;
    if (mockFIIEquity > 1000) {
      // Strong FII buying - DII might sell (profit booking)
      mockDIIEquity = -random2 * 1000 - 200; // -1200 to -200
    } else if (mockFIIEquity < -1000) {
      // Strong FII selling - DII might buy (supporting market)
      mockDIIEquity = random3 * 1000 + 200; // 200 to 1200
    } else {
      // Normal range - independent movement
      mockDIIEquity = random4 * 4000 - 1500; // -1500 to +2500
    }
    mockDIIEquity = Math.round(mockDIIEquity * 100) / 100;

    const data: FIIDIIData = {
      date: dateString,
      fii: {
        equity: mockFIIEquity,
        debt: Math.round((seededRandom(currentSeed++) * 500 - 200) * 100) / 100,
        total: Math.round((mockFIIEquity + seededRandom(currentSeed++) * 500 - 200) * 100) / 100,
      },
      dii: {
        equity: mockDIIEquity,
        debt: Math.round((seededRandom(currentSeed++) * 300 - 100) * 100) / 100,
        total: Math.round((mockDIIEquity + seededRandom(currentSeed++) * 300 - 100) * 100) / 100,
      },
      netFII: 0,
    };

    // Net FII is FII equity minus DII equity (shows net institutional flow)
    // Positive netFII = FII buying more than DII selling (bullish)
    // Negative netFII = FII selling more than DII buying (bearish)
    data.netFII = data.fii.equity - data.dii.equity;

    // Log for debugging - verify signs are correct
    console.log('FII/DII Data Generated:', {
      date: data.date,
      fiiEquity: data.fii.equity,
      diiEquity: data.dii.equity,
      netFII: data.netFII,
      fiiInterpretation: data.fii.equity > 0 ? 'BUYING' : data.fii.equity < 0 ? 'SELLING' : 'NEUTRAL',
      diiInterpretation: data.dii.equity > 0 ? 'BUYING' : data.dii.equity < 0 ? 'SELLING' : 'NEUTRAL',
    });

    return NextResponse.json({
      success: true,
      data,
      note: 'Using mock data. For production, integrate with NSE API or financial data provider.',
    });
  } catch (error) {
    console.error('Error fetching FII/DII data:', error);
    
    // Fallback mock data
    const fallbackData: FIIDIIData = {
      date: new Date().toISOString().split('T')[0],
      fii: {
        equity: 0,
        debt: 0,
        total: 0,
      },
      dii: {
        equity: 0,
        debt: 0,
        total: 0,
      },
      netFII: 0,
    };

    return NextResponse.json({
      success: false,
      data: fallbackData,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 200 });
  }
}

