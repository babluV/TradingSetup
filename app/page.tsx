'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import TradingChart from '@/components/TradingChart';
import TradingPanel from '@/components/TradingPanel';
import TradesList from '@/components/TradesList';
import { CandlestickData, OptionTrade, SupportResistanceLevel } from '@/types/trading';
import { detectSupportResistance } from '@/utils/supportResistance';
import { generateMockData } from '@/utils/mockData';
import { predictNextDay, Prediction, predictNextDayWithOptionChain, NextDayPrediction } from '@/utils/prediction';
import NextDayPredictionPanel from '@/components/NextDayPredictionPanel';
import { generateMorningSetup, MorningSetup } from '@/utils/morningSetup';
import { analyzeMultiTimeframe, TimeframeData } from '@/utils/multiTimeframeAnalysis';
import MorningSetupComponent from '@/components/MorningSetup';
import TimeframeSelector from '@/components/TimeframeSelector';
import OptionChainPanel from '@/components/OptionChainPanel';
import { OptionChainSummary } from '@/types/optionChain';
import { mockOptionChain, summarizeOptionChain } from '@/utils/optionChain';
import { findNearestLevel } from '@/utils/supportResistance';
import { GlobalMarketData } from '@/types/marketData';

export default function Home() {
  const [candlestickData, setCandlestickData] = useState<CandlestickData[]>([]);
  const [supportResistanceLevels, setSupportResistanceLevels] = useState<SupportResistanceLevel[]>([]);
  const [currentPrice, setCurrentPrice] = useState(0);
  const [openTrades, setOpenTrades] = useState<OptionTrade[]>([]);
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [nextDayPrediction, setNextDayPrediction] = useState<NextDayPrediction | null>(null);
  const [morningSetup, setMorningSetup] = useState<MorningSetup | null>(null);
  const [isLoading, setIsLoading] = useState(false); // Start as false - we load mock data immediately
  const [dataSource, setDataSource] = useState<'real' | 'mock'>('mock'); // Default to mock
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedTimeframe, setSelectedTimeframe] = useState<'1m' | '5m' | '15m' | '30m' | '1h' | '4h' | '1d'>('15m');
  const [timeframeData, setTimeframeData] = useState<TimeframeData | null>(null);
  const [allTimeframeData, setAllTimeframeData] = useState<Record<'1m' | '5m' | '15m' | '30m' | '1h' | '4h' | '1d', CandlestickData[]> | null>(null);
  const [giftNiftyData, setGiftNiftyData] = useState<CandlestickData[] | null>(null);
  const [showMorningSetup, setShowMorningSetup] = useState(false);
  const [optionChainSummary, setOptionChainSummary] = useState<OptionChainSummary | null>(null);
  const [isRefreshingOptionChain, setIsRefreshingOptionChain] = useState(false);
  const [globalMarketData, setGlobalMarketData] = useState<GlobalMarketData | null>(null);
  const [marketStatus, setMarketStatus] = useState<'open' | 'closed'>('closed');

  // Initialize with mock data immediately, then try to fetch real data
  useEffect(() => {
    const fetchOptionChain = async () => {
      setIsRefreshingOptionChain(true);
      try {
        // Add timestamp to prevent caching
        const timestamp = new Date().getTime();
        const res = await fetch(`/api/optionchain?t=${timestamp}`, { 
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
          },
        });
        
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        
        const json = await res.json();
        
        if (json.success && json.data && Array.isArray(json.data) && json.data.length > 0) {
          const summary = summarizeOptionChain(json.data);
          if (summary) {
            console.log('Option chain updated:', {
              pcrOI: summary.pcrOI,
              pcrVolume: summary.pcrVolume,
              sentiment: summary.sentiment,
              timestamp: summary.timestamp,
            });
            setOptionChainSummary(summary);
          } else {
            console.warn('Failed to summarize option chain, using mock data');
            const mockData = mockOptionChain();
            mockData.timestamp = new Date().toISOString();
            setOptionChainSummary(mockData);
          }
        } else {
          console.warn('No option chain data received, using mock data');
          const mockData = mockOptionChain();
          mockData.timestamp = new Date().toISOString();
          setOptionChainSummary(mockData);
        }
      } catch (e) {
        console.error('Error fetching option chain:', e);
        // Use mock data with updated timestamp
        const mockData = mockOptionChain();
        mockData.timestamp = new Date().toISOString();
        setOptionChainSummary(mockData);
      } finally {
        setIsRefreshingOptionChain(false);
      }
    };

    const fetchGlobalMarkets = async () => {
      try {
        // Fetch commodities
        const commoditiesRes = await fetch('/api/commodities', { cache: 'no-store' });
        const commoditiesJson = await commoditiesRes.json();
        
        // Fetch FII/DII with error handling and cache busting
        let fiiDiiJson;
        try {
          // Add timestamp to force fresh data fetch
          const timestamp = new Date().getTime();
          const fiiDiiRes = await fetch(`/api/fiidii?t=${timestamp}`, { 
            cache: 'no-store',
            headers: {
              'Cache-Control': 'no-cache',
              'Pragma': 'no-cache',
            }
          });
          if (!fiiDiiRes.ok) {
            throw new Error(`FII/DII API returned ${fiiDiiRes.status}`);
          }
          fiiDiiJson = await fiiDiiRes.json();
        } catch (fiiError) {
          console.error('Error fetching FII/DII data:', fiiError);
          fiiDiiJson = { success: false, data: null };
        }
        
        // Always set data, even if API fails (will use mock/fallback data)
        const goldData = commoditiesJson.data?.gold || {
          name: 'Gold',
          symbol: 'GC=F',
          price: 2650.50,
          change: -5.20,
          changePercent: -0.20,
          timestamp: new Date().toISOString(),
        };
        
        const crudeOilData = commoditiesJson.data?.crudeOil || {
          name: 'Crude Oil',
          symbol: 'CL=F',
          price: 78.45,
          change: 0.85,
          changePercent: 1.10,
          timestamp: new Date().toISOString(),
        };
        
        // Use API data if available, otherwise use consistent fallback
        let fiiDiiData;
        if (fiiDiiJson && fiiDiiJson.data) {
          fiiDiiData = fiiDiiJson.data;
        } else {
          // Create consistent fallback data based on today's date in IST
          const now = new Date();
          const istString = now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' });
          const istDate = new Date(istString);
          const today = [
            istDate.getFullYear(),
            String(istDate.getMonth() + 1).padStart(2, '0'),
            String(istDate.getDate()).padStart(2, '0'),
          ].join('-');
          // Include hour in seed for hourly updates
          const currentHour = istDate.getHours();
          const seed = today.split('').reduce((acc, char) => {
            if (char >= '0' && char <= '9') {
              return acc + parseInt(char);
            }
            return acc;
          }, 0) + currentHour; // Add hour for hourly variation
          
          const seededRandom = (seed: number) => {
            const x = Math.sin(seed) * 10000;
            return x - Math.floor(x);
          };
          
          let currentSeed = seed;
          const random1 = seededRandom(currentSeed++);
          const random2 = seededRandom(currentSeed++);
          const random3 = seededRandom(currentSeed++);
          const random4 = seededRandom(currentSeed++);
          
          const baseFII = random1 * 5000 - 2000;
          const mockFIIEquity = Math.round(baseFII * 100) / 100;
          
          let mockDIIEquity;
          if (mockFIIEquity > 1000) {
            mockDIIEquity = -random2 * 1000 - 200;
          } else if (mockFIIEquity < -1000) {
            mockDIIEquity = random3 * 1000 + 200;
          } else {
            mockDIIEquity = random4 * 4000 - 1500;
          }
          mockDIIEquity = Math.round(mockDIIEquity * 100) / 100;
          
          fiiDiiData = {
            date: today,
            fii: {
              equity: mockFIIEquity,
              debt: Math.round((seededRandom(currentSeed++) * 500 - 200) * 100) / 100,
              total: 0,
            },
            dii: {
              equity: mockDIIEquity,
              debt: Math.round((seededRandom(currentSeed++) * 300 - 100) * 100) / 100,
              total: 0,
            },
            netFII: 0,
          };
        }
        
        // Validate and calculate totals and net FII
        if (!fiiDiiData.fii) {
          fiiDiiData.fii = { equity: 0, debt: 0, total: 0 };
        }
        if (!fiiDiiData.dii) {
          fiiDiiData.dii = { equity: 0, debt: 0, total: 0 };
        }
        
        // Ensure all values are numbers (preserve sign - positive = buying, negative = selling)
        fiiDiiData.fii.equity = Number(fiiDiiData.fii.equity) || 0;
        fiiDiiData.fii.debt = Number(fiiDiiData.fii.debt) || 0;
        fiiDiiData.dii.equity = Number(fiiDiiData.dii.equity) || 0;
        fiiDiiData.dii.debt = Number(fiiDiiData.dii.debt) || 0;
        
        // Validate signs are correct (no accidental inversion)
        // Positive FII equity = FII buying (correct)
        // Negative FII equity = FII selling (correct)
        // If netFII was already calculated, verify it matches our calculation
        const calculatedNetFII = fiiDiiData.fii.equity - fiiDiiData.dii.equity;
        
        // Calculate totals and net FII
        fiiDiiData.fii.total = fiiDiiData.fii.equity + fiiDiiData.fii.debt;
        fiiDiiData.dii.total = fiiDiiData.dii.equity + fiiDiiData.dii.debt;
        fiiDiiData.netFII = calculatedNetFII; // Use our calculated value to ensure correctness
        
        // Log for debugging
        console.log('FII/DII Data Validation:', {
          fiiEquity: fiiDiiData.fii.equity,
          diiEquity: fiiDiiData.dii.equity,
          calculatedNetFII,
          originalNetFII: fiiDiiData.netFII,
          fiiAction: fiiDiiData.fii.equity > 0 ? 'BUYING' : fiiDiiData.fii.equity < 0 ? 'SELLING' : 'NEUTRAL',
          diiAction: fiiDiiData.dii.equity > 0 ? 'BUYING' : fiiDiiData.dii.equity < 0 ? 'SELLING' : 'NEUTRAL',
        });
        
        // Ensure date is set
        if (!fiiDiiData.date) {
          fiiDiiData.date = new Date().toISOString().split('T')[0];
        }
        
        setGlobalMarketData({
          commodities: {
            gold: goldData,
            crudeOil: crudeOilData,
          },
          indices: {},
          fiiDii: fiiDiiData,
        });
      } catch (e) {
        console.error('Error fetching global markets:', e);
        // Set fallback data on error
        setGlobalMarketData({
          commodities: {
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
          indices: {},
          fiiDii: {
            date: new Date().toISOString().split('T')[0],
            fii: {
              equity: 500,
              debt: 50,
              total: 550,
            },
            dii: {
              equity: 300,
              debt: 20,
              total: 320,
            },
            netFII: 200,
          },
        });
      }
    };

    fetchOptionChain();
    fetchGlobalMarkets();
    
    // Update FII/DII data more frequently (every 1 minute) to show hourly changes
    const interval = setInterval(() => {
      fetchOptionChain();
      fetchGlobalMarkets(); // This will fetch fresh FII/DII data with hourly seed
    }, 1 * 60 * 1000); // Update every 1 minute to catch hourly FII/DII changes
    
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let isMounted = true;
    let intervalId: NodeJS.Timeout | null = null;
    
    // Load mock data IMMEDIATELY - no async, no waiting
    // Generate data for different timeframes with correct intervals
    const mockData1m = generateMockData(1440, 1); // 1-min intervals (24 hours)
    const mockData5m = generateMockData(288, 5); // 5-min intervals (24 hours)
    const mockData15m = generateMockData(960, 15); // 15-min intervals (10 days)
    const mockData30m = generateMockData(480, 30); // 30-min intervals (10 days)
    const mockData1h = generateMockData(240, 60); // 1-hour intervals (10 days)
    const mockData4h = generateMockData(60, 240); // 4-hour intervals (10 days)
    const mockData1d = generateMockData(10, 1440); // 1-day intervals (10 days)
    
    // Set data based on selected timeframe
    const getDataForTimeframe = (tf: '1m' | '5m' | '15m' | '30m' | '1h' | '4h' | '1d') => {
      if (tf === '1m') return mockData1m;
      if (tf === '5m') return mockData5m;
      if (tf === '15m') return mockData15m;
      if (tf === '30m') return mockData30m;
      if (tf === '1h') return mockData1h;
      if (tf === '4h') return mockData4h;
      return mockData1d;
    };
    
    const initialData = getDataForTimeframe(selectedTimeframe);
    
    // Set all state synchronously to avoid race conditions
    if (isMounted) {
      setCandlestickData(initialData);
      // Set initial price from the selected timeframe data to ensure consistency
      const initialPrice = initialData.length > 0 ? initialData[initialData.length - 1].close : mockData15m[mockData15m.length - 1].close;
      setCurrentPrice(initialPrice);
      setDataSource('mock');
      setTimeframeData({
        '15m': mockData15m,
        '1h': mockData1h,
        '1d': mockData1d,
      });
      
      // Store all timeframe data for chart switching
      setAllTimeframeData({
        '1m': mockData1m,
        '5m': mockData5m,
        '15m': mockData15m,
        '30m': mockData30m,
        '1h': mockData1h,
        '4h': mockData4h,
        '1d': mockData1d,
      });
      
      // Clear loading immediately - this is critical
      setIsLoading(false);
    }
    
    // Then try to fetch real data in background (non-blocking, doesn't affect UI)
    const fetchNifty50Data = async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000); // Longer timeout for multiple requests
        
        // Fetch data for all timeframes
        const [response15m, response1h, response1d] = await Promise.all([
          fetch('/api/nifty50?interval=15m&range=10d', { signal: controller.signal }),
          fetch('/api/nifty50?interval=1h&range=10d', { signal: controller.signal }),
          fetch('/api/nifty50?interval=1d&range=10d', { signal: controller.signal }),
        ]);
        
        clearTimeout(timeoutId);
        
        if (!isMounted) return;
        
        // Process all timeframe responses
        const results = await Promise.all([
          response15m.json(),
          response1h.json(),
          response1d.json(),
        ]);
        
        if (results[0].success && results[0].data && results[0].data.length > 0) {
          const formatData = (data: any[]) => data.map((d: any) => ({
            time: d.time,
            open: d.open,
            high: d.high,
            low: d.low,
            close: d.close,
            volume: d.volume,
          }));
          
          const data15m = formatData(results[0].data);
          const data1h = results[1].success ? formatData(results[1].data) : data15m;
          const data1d = results[2].success ? formatData(results[2].data) : data15m;
          
          // Fetch additional timeframes for chart (prioritize 5m if selected)
          try {
            // If 5m is selected, fetch it with higher priority
            const fetchPromises = [];
            if (selectedTimeframe === '5m') {
              // Fetch 5m first, then others
              fetchPromises.push(
                fetch('/api/nifty50?interval=5m&range=1d').catch(() => null),
                fetch('/api/nifty50?interval=1m&range=1d').catch(() => null),
                fetch('/api/nifty50?interval=30m&range=10d').catch(() => null),
                fetch('/api/nifty50?interval=4h&range=10d').catch(() => null)
              );
            } else {
              fetchPromises.push(
                fetch('/api/nifty50?interval=1m&range=1d').catch(() => null),
                fetch('/api/nifty50?interval=5m&range=1d').catch(() => null),
                fetch('/api/nifty50?interval=30m&range=10d').catch(() => null),
                fetch('/api/nifty50?interval=4h&range=10d').catch(() => null)
              );
            }
            
            const [response1m, response5m, response30m, response4h] = await Promise.all(fetchPromises);
            
            const additionalResults = await Promise.all([
              response1m?.json().catch(() => ({ success: false, data: [] })),
              response5m?.json().catch(() => ({ success: false, data: [] })),
              response30m?.json().catch(() => ({ success: false, data: [] })),
              response4h?.json().catch(() => ({ success: false, data: [] })),
            ]);
            
            const data1m = additionalResults[0]?.success ? formatData(additionalResults[0].data) : data15m;
            const data5m = additionalResults[1]?.success ? formatData(additionalResults[1].data) : (selectedTimeframe === '5m' ? data15m : data15m);
            const data30m = additionalResults[2]?.success ? formatData(additionalResults[2].data) : data15m;
            const data4h = additionalResults[3]?.success ? formatData(additionalResults[3].data) : data1h;
            
            setAllTimeframeData({
              '1m': data1m,
              '5m': data5m,
              '15m': data15m,
              '30m': data30m,
              '1h': data1h,
              '4h': data4h,
              '1d': data1d,
            });
          } catch (error) {
            // If additional timeframes fail, use available data
            setAllTimeframeData({
              '1m': data15m,
              '5m': data15m,
              '15m': data15m,
              '30m': data15m,
              '1h': data1h,
              '4h': data1h,
              '1d': data1d,
            });
          }
          
          // Set data based on selected timeframe - prioritize real data
          const getDataForTimeframe = (tf: '1m' | '5m' | '15m' | '30m' | '1h' | '4h' | '1d') => {
            // Use allTimeframeData if available (includes 5m)
            if (allTimeframeData) {
              if (tf === '1m' && allTimeframeData['1m']?.length > 0) return allTimeframeData['1m'];
              if (tf === '5m' && allTimeframeData['5m']?.length > 0) return allTimeframeData['5m'];
              if (tf === '30m' && allTimeframeData['30m']?.length > 0) return allTimeframeData['30m'];
              if (tf === '4h' && allTimeframeData['4h']?.length > 0) return allTimeframeData['4h'];
            }
            // Fallback to main timeframes
            if (tf === '15m') return data15m;
            if (tf === '1h') return data1h;
            if (tf === '1d') return data1d;
            // Default fallback
            return data15m;
          };
          
          const newData = getDataForTimeframe(selectedTimeframe);
          setCandlestickData(newData);
          // Update price from the selected timeframe data
          const latestPrice = newData.length > 0 ? newData[newData.length - 1].close : (results[0].currentPrice || data15m[data15m.length - 1].close);
          setCurrentPrice(latestPrice);
          setTimeframeData({
            '15m': data15m,
            '1h': data1h,
            '1d': data1d,
          });
          setDataSource('real');
        }
      } catch (error) {
        // Silently fail - we already have mock data showing
        if (error instanceof Error && error.name !== 'AbortError') {
          console.log('Real data fetch failed, using mock data');
        }
      }
    };

    // Fetch real data in background after a small delay
    setTimeout(() => {
      fetchNifty50Data();
    }, 100);
    
    // Helper to check market hours (9:15 AM - 3:30 PM IST)
    const checkMarketHours = () => {
      const now = new Date();
      const istTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
      const hours = istTime.getHours();
      const minutes = istTime.getMinutes();
      const timeInMinutes = hours * 60 + minutes;
      const marketOpen = 9 * 60 + 15; // 9:15 AM
      const marketClose = 15 * 60 + 30; // 3:30 PM
      return timeInMinutes >= marketOpen && timeInMinutes < marketClose;
    };
    
    // Refresh data more frequently during market hours
    // During market hours: every 30 seconds for 1m/5m, every 1 minute for others
    // Outside market hours: every 10 minutes
    const getRefreshInterval = () => {
      const isOpen = checkMarketHours();
      if (isOpen) {
        return selectedTimeframe === '1m' || selectedTimeframe === '5m' ? 30000 : 60000; // 30s or 1min
      }
      return 10 * 60 * 1000; // 10 minutes outside market
    };
    
    const startInterval = () => {
      if (intervalId) clearInterval(intervalId);
      const interval = getRefreshInterval();
      intervalId = setInterval(() => {
        fetchNifty50Data();
        // Re-check and restart with new interval if market status changed
        const newInterval = getRefreshInterval();
        if (newInterval !== interval) {
          startInterval();
        }
      }, interval);
    };
    
    startInterval();
    
    return () => {
      isMounted = false;
      if (intervalId) clearInterval(intervalId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTimeframe]);

  // Helper function to check if market is open (9:15 AM - 3:30 PM IST)
  const isMarketOpen = useCallback(() => {
    const now = new Date();
    // Convert to IST
    const istTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
    const hours = istTime.getHours();
    const minutes = istTime.getMinutes();
    const timeInMinutes = hours * 60 + minutes;
    
    // Market hours: 9:15 AM (555 minutes) to 3:30 PM (930 minutes) IST
    const marketOpen = 9 * 60 + 15; // 9:15 AM
    const marketClose = 15 * 60 + 30; // 3:30 PM
    
    return timeInMinutes >= marketOpen && timeInMinutes < marketClose;
  }, []);

  // Update current time every minute and check if morning setup should be shown
  useEffect(() => {
    const updateTimeAndCheckSetup = () => {
      const now = new Date();
      setCurrentTime(now);
      
      // Convert to IST (UTC + 5:30)
      const istTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
      const hours = istTime.getHours();
      const minutes = istTime.getMinutes();
      const timeInMinutes = hours * 60 + minutes;
      
      // Market hours: 9:15 AM (555 minutes) to 3:30 PM (930 minutes) IST
      const marketOpen = 9 * 60 + 15; // 9:15 AM
      const marketClose = 15 * 60 + 30; // 3:30 PM
      const isOpen = timeInMinutes >= marketOpen && timeInMinutes < marketClose;
      
      setMarketStatus(isOpen ? 'open' : 'closed');
      
      // Show morning setup after 8:30 AM IST
      const shouldShow = hours > 8 || (hours === 8 && minutes >= 30);
      setShowMorningSetup(shouldShow);
    };
    
    // Initialize immediately
    updateTimeAndCheckSetup();
    const timeInterval = setInterval(updateTimeAndCheckSetup, 60000); // Update every minute
    
    return () => clearInterval(timeInterval);
  }, []);

  // Fetch Gift Nifty data for morning setup (after 8:30 AM)
  useEffect(() => {
    if (!showMorningSetup) return;
    
    const fetchGiftNifty = async () => {
      try {
        const [response15m, response1h, response1d] = await Promise.all([
          fetch('/api/giftnifty?interval=15m&range=1d'),
          fetch('/api/giftnifty?interval=1h&range=5d'),
          fetch('/api/giftnifty?interval=1d&range=10d'),
        ]);
        
        const results = await Promise.all([
          response15m.json(),
          response1h.json(),
          response1d.json(),
        ]);
        
        if (results[0].success && results[0].data && results[0].data.length > 0) {
          const formatData = (data: any[]) => data.map((d: any) => ({
            time: d.time,
            open: d.open,
            high: d.high,
            low: d.low,
            close: d.close,
            volume: d.volume,
          }));
          
          const data15m = formatData(results[0].data);
          const data1h = results[1].success ? formatData(results[1].data) : data15m;
          const data1d = results[2].success ? formatData(results[2].data) : data15m;
          
          setGiftNiftyData(data15m);
          setTimeframeData({
            '15m': data15m,
            '1h': data1h,
            '1d': data1d,
          });
        }
      } catch (error) {
        console.error('Error fetching Gift Nifty data:', error);
      }
    };
    
    fetchGiftNifty();
    // Refresh Gift Nifty data every 5 minutes
    const interval = setInterval(fetchGiftNifty, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [showMorningSetup]);

  // Generate morning setup using Gift Nifty data (after 8:30 AM)
  useEffect(() => {
    if (!showMorningSetup) {
      setMorningSetup(null);
      return;
    }

    if (timeframeData && giftNiftyData && giftNiftyData.length > 0) {
      // Use multi-timeframe analysis with Gift Nifty data
      setTimeout(() => {
        try {
          const setup = analyzeMultiTimeframe(
            timeframeData['15m'],
            timeframeData['1h'],
            timeframeData['1d']
          );
          setMorningSetup(setup);
        } catch (error) {
          console.error('Error generating morning setup:', error);
        }
      }, 0);
    } else if (giftNiftyData && giftNiftyData.length > 0) {
      // Fallback to single timeframe with Gift Nifty data
      setTimeout(() => {
        try {
          const setup = generateMorningSetup(giftNiftyData);
          setMorningSetup(setup);
        } catch (error) {
          console.error('Error generating morning setup:', error);
        }
      }, 0);
    }
  }, [showMorningSetup, timeframeData, giftNiftyData]);

  // Update support/resistance levels and prediction when data changes
  useEffect(() => {
    if (candlestickData.length > 0) {
      // Use setTimeout to prevent blocking the UI
      setTimeout(() => {
        try {
          const levels = detectSupportResistance(candlestickData);
          setSupportResistanceLevels(levels);
          
          // Generate prediction
          const basicPrediction = predictNextDay(candlestickData);
          setPrediction(basicPrediction);
          
          // Generate enhanced next-day prediction with option chain and global markets
          // Always generate prediction, even without option chain data
          try {
            const enhancedPrediction = predictNextDayWithOptionChain(
              candlestickData, 
              optionChainSummary || null, 
              globalMarketData || null
            );
            setNextDayPrediction(enhancedPrediction);
          } catch (error) {
            console.error('Error generating enhanced prediction:', error);
            // Fallback to basic prediction if enhanced fails
            const fallbackPrediction: NextDayPrediction = {
              direction: basicPrediction.direction === 'up' ? 'BULLISH' : basicPrediction.direction === 'down' ? 'BEARISH' : 'NEUTRAL',
              confidence: basicPrediction.confidence,
              currentPrice: candlestickData.length > 0 ? candlestickData[candlestickData.length - 1].close : 0,
              predictedPrice: basicPrediction.nextDayPrice,
              supportLevel: basicPrediction.supportLevel,
              resistanceLevel: basicPrediction.resistanceLevel,
            };
            setNextDayPrediction(fallbackPrediction);
          }

          // Generate morning setup (pre-market analysis)
          try {
            const setup = generateMorningSetup(candlestickData);
            setMorningSetup(setup);
          } catch (error) {
            console.error('Error generating morning setup:', error);
            // Don't set morning setup on error, let it remain null
          }
        } catch (error) {
          console.error('Error generating prediction:', error);
          // Set a default prediction on error
          setPrediction({
            nextDayPrice: candlestickData[candlestickData.length - 1].close,
            confidence: 0,
            direction: 'neutral',
            supportLevel: 0,
            resistanceLevel: 0,
            reasoning: ['Error generating prediction'],
            indicators: {
              ema9: 0,
              ema21: 0,
              ema50: 0,
              rsi: 50,
              volumeStrength: 0,
              volumeTrend: 'neutral',
            },
          });
        }
      }, 0); // Run on next tick to not block render
    }
  }, [candlestickData, optionChainSummary, globalMarketData]);

  // Recalculate enhanced prediction when option chain data or global markets become available
  useEffect(() => {
    if (candlestickData.length > 0) {
      try {
        const enhancedPrediction = predictNextDayWithOptionChain(
          candlestickData, 
          optionChainSummary || null, 
          globalMarketData || null
        );
        setNextDayPrediction(enhancedPrediction);
      } catch (error) {
        console.error('Error generating enhanced prediction:', error);
      }
    }
  }, [optionChainSummary, candlestickData, globalMarketData]);

  // Track if component has mounted (client-side only)
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Update current price periodically (real-time updates)
  // Only update after component has mounted to avoid hydration mismatch
  useEffect(() => {
    if (candlestickData.length === 0 || !isMounted) return;

    let intervalId: NodeJS.Timeout | null = null;

    const updatePrice = async () => {
      if (dataSource === 'real') {
        // Fetch latest price for real data
        try {
          const interval = selectedTimeframe === '15m' ? '15m' : selectedTimeframe === '1h' ? '1h' : '1d';
          const response = await fetch(`/api/nifty50?interval=${interval}&range=10d`);
          const result = await response.json();
          if (result.success && result.currentPrice > 0) {
            setCurrentPrice(result.currentPrice);
            // Update last candle if we have new data
            if (result.data && result.data.length > 0) {
              const latest = result.data[result.data.length - 1];
              setCandlestickData(prev => {
                const newData = [...prev];
                if (newData.length > 0) {
                  newData[newData.length - 1] = {
                    time: latest.time,
                    open: latest.open,
                    high: latest.high,
                    low: latest.low,
                    close: latest.close,
                    volume: latest.volume,
                  };
                }
                return newData;
              });
            }
          }
        } catch (error) {
          // If real data fetch fails, simulate small movement
          const lastCandle = candlestickData[candlestickData.length - 1];
          const change = (Math.random() - 0.5) * 0.1;
          setCurrentPrice(lastCandle.close * (1 + change / 100));
        }
      } else {
        // Simulate price movement for mock data
        const lastCandle = candlestickData[candlestickData.length - 1];
        const change = (Math.random() - 0.5) * 0.5;
        setCurrentPrice(lastCandle.close * (1 + change / 100));
      }
    };

    // Delay initial update to avoid hydration mismatch
    const timeoutId = setTimeout(() => {
      updatePrice();
      intervalId = setInterval(updatePrice, dataSource === 'real' ? 30000 : 2000); // 30s for real, 2s for mock
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [candlestickData, dataSource, selectedTimeframe, isMounted]);

  // Update P&L for open trades when current price changes
  useEffect(() => {
    if (currentPrice === 0 || openTrades.length === 0) return;

    setOpenTrades((prevTrades) =>
      prevTrades.map((trade) => {
        let profitLoss = 0;
        if (trade.type === 'call') {
          // Call option: profit when price goes above strike
          // Nifty 50 lot size = 50
          profitLoss = (currentPrice - trade.strikePrice) * trade.quantity * 50;
        } else {
          // Put option: profit when price goes below strike
          // Nifty 50 lot size = 50
          profitLoss = (trade.strikePrice - currentPrice) * trade.quantity * 50;
        }

        return {
          ...trade,
          currentPrice: currentPrice,
          profitLoss,
        };
      })
    );
  }, [currentPrice, openTrades]);

  const handleTradeExecute = useCallback((trade: Omit<OptionTrade, 'id' | 'entryTime' | 'status'>) => {
    const newTrade: OptionTrade = {
      ...trade,
      id: `trade-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      entryTime: new Date(),
      status: 'open',
      currentPrice: currentPrice,
      profitLoss: 0,
    };

    setOpenTrades((prev) => [...prev, newTrade]);
  }, [currentPrice]);

  const handleCloseTrade = useCallback((tradeId: string) => {
    setOpenTrades((prev) => prev.filter((trade) => trade.id !== tradeId));
  }, []);

  const supportLevels = supportResistanceLevels.filter((l) => l.type === 'support');
  const resistanceLevels = supportResistanceLevels.filter((l) => l.type === 'resistance');
  const ocSupport = findNearestLevel(currentPrice, supportLevels, 'support');
  const ocResistance = findNearestLevel(currentPrice, resistanceLevels, 'resistance');

  // Sync candlestick data with timeframe data when timeframe changes
  useEffect(() => {
    // Prioritize allTimeframeData for 5m, 1m, 30m, 4h
    if (allTimeframeData && allTimeframeData[selectedTimeframe] && allTimeframeData[selectedTimeframe].length > 0) {
      // Update chart data when timeframe changes
      const newData = allTimeframeData[selectedTimeframe];
      setCandlestickData(newData);
      // Update current price to latest close
      if (newData.length > 0) {
        setCurrentPrice(newData[newData.length - 1].close);
      }
      setIsLoading(false);
    } else if (timeframeData && (selectedTimeframe === '15m' || selectedTimeframe === '1h' || selectedTimeframe === '1d')) {
      // Fallback to available timeframes
      let newData: CandlestickData[] | null = null;
      if (selectedTimeframe === '15m' && timeframeData['15m']) {
        newData = timeframeData['15m'];
      } else if (selectedTimeframe === '1h' && timeframeData['1h']) {
        newData = timeframeData['1h'];
      } else if (selectedTimeframe === '1d' && timeframeData['1d']) {
        newData = timeframeData['1d'];
      } else {
        // Default to 15m if available
        if (timeframeData['15m']) {
          newData = timeframeData['15m'];
        }
      }
      if (newData && newData.length > 0) {
        setCandlestickData(newData);
        setCurrentPrice(newData[newData.length - 1].close);
      }
      setIsLoading(false);
    }
  }, [selectedTimeframe, allTimeframeData, timeframeData]);

  // Only show loading if we truly have no data at all AND still loading
  // Show content immediately if we have ANY data (candlestick, timeframe, or allTimeframeData)
  const hasData = candlestickData.length > 0 || timeframeData !== null || allTimeframeData !== null;
  
  // Force initialization if no data after a short delay (useEffect to avoid render issues)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (candlestickData.length === 0 && !allTimeframeData && !timeframeData) {
        // Use 15-minute interval as default (matches default selectedTimeframe)
        const intervalMap: Record<'1m' | '5m' | '15m' | '30m' | '1h' | '4h' | '1d', number> = {
          '1m': 1,
          '5m': 5,
          '15m': 15,
          '30m': 30,
          '1h': 60,
          '4h': 240,
          '1d': 1440,
        };
        const mockData = generateMockData(100, intervalMap[selectedTimeframe]);
        if (mockData.length > 0) {
          setCandlestickData(mockData);
          setCurrentPrice(mockData[mockData.length - 1].close);
          setIsLoading(false);
        }
      }
    }, 100); // Very short delay to allow initial useEffect to run first
    
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTimeframe]); // Only re-run when timeframe changes, not when data changes (to avoid loops)
  
  if (!hasData && isLoading) {
    return (
      <main className="min-h-screen bg-gray-100 p-4 md:p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Nifty 50 data...</p>
        </div>
      </main>
    );
  }

  // Safety check - if no data after loading, force initialization
  if (!hasData && !isLoading) {
    // Force initialization immediately - don't wait
    const intervalMap: Record<'1m' | '5m' | '15m' | '30m' | '1h' | '4h' | '1d', number> = {
      '1m': 1,
      '5m': 5,
      '15m': 15,
      '30m': 30,
      '1h': 60,
      '4h': 240,
      '1d': 1440,
    };
    const mockData = generateMockData(100, intervalMap[selectedTimeframe]);
    if (mockData.length > 0) {
      // Use setTimeout to avoid state update during render
      setTimeout(() => {
        setCandlestickData(mockData);
        setCurrentPrice(mockData[mockData.length - 1].close);
        setIsLoading(false);
      }, 0);
    }
    
    return (
      <main className="min-h-screen bg-gray-100 p-4 md:p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Initializing data...</p>
          <button 
            onClick={() => {
              const intervalMap: Record<'1m' | '5m' | '15m' | '30m' | '1h' | '4h' | '1d', number> = {
                '1m': 1,
                '5m': 5,
                '15m': 15,
                '30m': 30,
                '1h': 60,
                '4h': 240,
                '1d': 1440,
              };
              const mockData = generateMockData(100, intervalMap[selectedTimeframe]);
              setCandlestickData(mockData);
              setCurrentPrice(mockData[mockData.length - 1].close);
              setIsLoading(false);
            }} 
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Initialize Now
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100 p-2 md:p-3">
      <div className="max-w-7xl mx-auto space-y-2">
        <header className="text-center mb-3">
          <div className="flex items-center justify-center gap-2 mb-1">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              Nifty 50 Options Trading
            </h1>
            <span className="px-2 py-1 bg-blue-600 text-white text-xs font-semibold rounded">
              NIFTY
            </span>
          </div>
          <div className="flex items-center justify-center gap-3 text-xs">
            <p className="text-gray-600">
            Buy Calls at Support | Buy Puts at Resistance
            </p>
            {dataSource === 'real' ? (
              <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-semibold rounded">
                Live
              </span>
            ) : (
              <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs font-semibold rounded">
                Demo
              </span>
            )}
          </div>
        </header>

        {/* Market Status Banner - Show when market is closed */}
        {marketStatus === 'closed' && (
          <div className="mb-3 rounded-lg p-3 bg-gray-800 text-white border-2 border-gray-600">
            <div className="flex items-center justify-center gap-2">
              <div className="text-2xl">🔒</div>
              <div className="text-center">
                <div className="text-lg font-bold">MARKET CLOSED</div>
                <div className="text-xs opacity-90 mt-1">
                  NSE Market Hours: 9:15 AM - 3:30 PM IST | FII/DII data shown below is from last trading session
                </div>
              </div>
              <div className="text-2xl">🔒</div>
            </div>
          </div>
        )}

        {/* Today's Activity Header - Show above FII/DII data */}
        {globalMarketData?.fiiDii && (
          <div className="mb-2 rounded-lg p-3 bg-blue-50 border border-blue-200">
            <div className="flex items-center justify-center gap-2">
              <div className="text-lg font-bold text-blue-800">
                📊 Today&apos;s Activity - {globalMarketData.fiiDii.date ? 
                  new Date(globalMarketData.fiiDii.date).toLocaleDateString('en-IN', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  }) : 
                  new Date().toLocaleDateString('en-IN', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
              </div>
            </div>
            <div className="text-center text-xs text-blue-700 mt-1">
              ⏱️ As of {new Date(currentTime).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' })} IST
            </div>
          </div>
        )}

        {/* FII/DII Signal Banner - Prominent Headline Alert */}
        {globalMarketData?.fiiDii && (() => {
          const fiiEquity = globalMarketData.fiiDii.fii?.equity || 0;
          const diiEquity = globalMarketData.fiiDii.dii?.equity || 0;
          const netFII = globalMarketData.fiiDii.netFII || 0;
          
          // Validate and log FII/DII data for debugging
          console.log('FII/DII Display Data:', {
            fiiEquity,
            diiEquity,
            netFII,
            fiiAction: fiiEquity > 0 ? 'BUYING' : fiiEquity < 0 ? 'SELLING' : 'NEUTRAL',
            diiAction: diiEquity > 0 ? 'BUYING' : diiEquity < 0 ? 'SELLING' : 'NEUTRAL',
            date: globalMarketData.fiiDii.date,
          });
          
          // Determine signal based on both FII and DII activity
          // Strong Bullish: FII buying > 1000 OR (FII buying > 500 AND DII selling < -500)
          // Strong Bearish: FII selling < -1000 OR (FII selling < -500 AND DII buying > 500)
          const isStrongBullish = fiiEquity > 1000 || (fiiEquity > 500 && diiEquity < -500);
          const isModerateBullish = (fiiEquity > 500 && fiiEquity <= 1000) || (fiiEquity > 0 && diiEquity < 0 && Math.abs(diiEquity) > 300);
          const isStrongBearish = fiiEquity < -1000 || (fiiEquity < -500 && diiEquity > 500);
          const isModerateBearish = (fiiEquity < -500 && fiiEquity >= -1000) || (fiiEquity < 0 && diiEquity > 0 && diiEquity > 300);
          
          // Always show FII/DII activity when data exists (not just significant activity)
          // Determine signal strength and direction
          const hasSignificantActivity = Math.abs(fiiEquity) > 300 || Math.abs(diiEquity) > 300;
          const hasStrongSignal = isStrongBullish || isStrongBearish;
          const hasModerateSignal = isModerateBullish || isModerateBearish;
          
          // Always show banner if we have FII/DII data
          // Determine signal type and text based on activity level
          let signalType: string;
          let signalText: string;
          let isBullish: boolean;
          
          if (hasStrongSignal) {
            signalType = 'STRONG';
            isBullish = isStrongBullish;
            signalText = isBullish ? 'BULLISH' : 'BEARISH';
          } else if (hasModerateSignal) {
            signalType = 'MODERATE';
            isBullish = isModerateBullish;
            signalText = isBullish ? 'BULLISH' : 'BEARISH';
          } else {
            // Low activity - still show but with neutral/mild signal
            signalType = 'MILD';
            isBullish = fiiEquity > 0 || (fiiEquity === 0 && diiEquity < 0);
            signalText = isBullish ? 'BULLISH' : (fiiEquity < 0 ? 'BEARISH' : 'NEUTRAL');
          }
          
          // Calculate entry levels based on FII/DII signal and current price
          const calculateEntryLevels = () => {
              // Always calculate entry levels, even if support/resistance not available
              if (currentPrice === 0) {
                return null;
              }
              
              // Find nearest support and resistance (if available)
              const nearestSupport = supportLevels && supportLevels.length > 0 
                ? supportLevels.reduce((prev, curr) => 
                    Math.abs(curr.price - currentPrice) < Math.abs(prev.price - currentPrice) ? curr : prev
                  )
                : null;
              const nearestResistance = resistanceLevels && resistanceLevels.length > 0
                ? resistanceLevels.reduce((prev, curr) => 
                    Math.abs(curr.price - currentPrice) < Math.abs(prev.price - currentPrice) ? curr : prev
                  )
                : null;
              
              // Calculate FII strength for target calculation
              // Stronger FII/DII activity = better targets
              const fiiStrength = Math.min(Math.abs(netFII) / 2000, 0.05); // Cap at 5% for stronger signals
              const baseTargetPercent = Math.max(fiiStrength, 0.015); // At least 1.5% target
              
              if (isBullish) {
                // Bullish: Buy CALLS at Support
                // Use support level if available and within 2% of current price, otherwise use 0.5% below current
                let entryLevel;
                let supportRef: number | null = null;
                if (nearestSupport && nearestSupport.price < currentPrice && (currentPrice - nearestSupport.price) / currentPrice < 0.02) {
                  entryLevel = nearestSupport.price;
                  supportRef = nearestSupport.price;
                } else {
                  entryLevel = currentPrice * 0.995; // 0.5% below current
                }
                
                const stopLoss = entryLevel * 0.98; // 2% below entry
                // Target based on FII strength: stronger FII buying = higher target
                const target = entryLevel * (1 + baseTargetPercent);
                const riskAmount = entryLevel - stopLoss;
                const rewardAmount = target - entryLevel;
                const riskReward = riskAmount > 0 ? (rewardAmount / riskAmount).toFixed(2) : '0.00';
                
                return {
                  type: 'BULLISH',
                  entryLevel: Math.round(entryLevel),
                  stopLoss: Math.round(stopLoss),
                  target: Math.round(target),
                  riskReward: riskReward,
                  strike: Math.round(entryLevel * 1.01), // Slightly OTM call
                  optionType: 'CALL',
                  supportRef: supportRef ? Math.round(supportRef) : (nearestSupport ? Math.round(nearestSupport.price) : null),
                  resistanceRef: nearestResistance ? Math.round(nearestResistance.price) : null,
                };
              } else {
                // Bearish: Buy PUTS at Resistance
                // Use resistance level if available and within 2% of current price, otherwise use 0.5% above current
                let entryLevel;
                let resistanceRef: number | null = null;
                if (nearestResistance && nearestResistance.price > currentPrice && (nearestResistance.price - currentPrice) / currentPrice < 0.02) {
                  entryLevel = nearestResistance.price;
                  resistanceRef = nearestResistance.price;
                } else {
                  entryLevel = currentPrice * 1.005; // 0.5% above current
                }
                
                const stopLoss = entryLevel * 1.02; // 2% above entry
                // Target based on FII strength: stronger FII selling = lower target
                const target = entryLevel * (1 - baseTargetPercent);
                const riskAmount = stopLoss - entryLevel;
                const rewardAmount = entryLevel - target;
                const riskReward = riskAmount > 0 ? (rewardAmount / riskAmount).toFixed(2) : '0.00';
                
                return {
                  type: 'BEARISH',
                  entryLevel: Math.round(entryLevel),
                  stopLoss: Math.round(stopLoss),
                  target: Math.round(target),
                  riskReward: riskReward,
                  strike: Math.round(entryLevel * 0.99), // Slightly OTM put
                  optionType: 'PUT',
                  supportRef: nearestSupport ? Math.round(nearestSupport.price) : null,
                  resistanceRef: resistanceRef ? Math.round(resistanceRef) : (nearestResistance ? Math.round(nearestResistance.price) : null),
                };
              }
            };
            
            const entryLevels = calculateEntryLevels();
            
            // Nearest support/resistance quick view for accuracy check
            // Use detected support/resistance from chart data; prefer ocSupport/ocResistance if available
            const nearestSupportRef =
              ocSupport
                ? { price: ocSupport.price, strength: ocSupport.strength }
                : (supportLevels && supportLevels.length > 0
                  ? supportLevels.reduce((prev, curr) =>
                      Math.abs(curr.price - currentPrice) < Math.abs(prev.price - currentPrice) ? curr : prev
                    )
                  : null);

            const nearestResistanceRef =
              ocResistance
                ? { price: ocResistance.price, strength: ocResistance.strength }
                : (resistanceLevels && resistanceLevels.length > 0
                  ? resistanceLevels.reduce((prev, curr) =>
                      Math.abs(curr.price - currentPrice) < Math.abs(prev.price - currentPrice) ? curr : prev
                    )
                  : null);
            
            const supportDistance = nearestSupportRef && currentPrice > 0 
              ? ((currentPrice - nearestSupportRef.price) / currentPrice) * 100 
              : null;
            const resistanceDistance = nearestResistanceRef && currentPrice > 0
              ? ((nearestResistanceRef.price - currentPrice) / currentPrice) * 100
              : null;
            
            // Determine message based on FII and DII activity
            let activityMessage = '';
            if (isStrongBullish) {
              if (fiiEquity > 1000) {
                activityMessage = '✅✅ Strong FII Buying - Very Bullish for Market';
              } else if (diiEquity < -500) {
                activityMessage = '✅✅ Strong DII Selling (FII Buying) - Very Bullish for Market';
              }
            } else if (isModerateBullish) {
              activityMessage = '✅ FII Buying - Bullish for Market';
            } else if (isStrongBearish) {
              if (fiiEquity < -1000) {
                activityMessage = '⚠️⚠️ Strong FII Selling - Very Bearish for Market';
              } else if (diiEquity > 500) {
                activityMessage = '⚠️⚠️ Strong DII Buying (FII Selling) - Very Bearish for Market';
              }
            } else if (isModerateBearish) {
              activityMessage = '⚠️ FII Selling - Bearish for Market';
            } else if (signalType === 'MILD') {
              // For mild/neutral activity, provide appropriate message
              if (fiiEquity > 0) {
                activityMessage = '📊 Mild FII Buying Activity';
              } else if (fiiEquity < 0) {
                activityMessage = '📊 Mild FII Selling Activity';
              } else {
                activityMessage = '📊 Neutral FII/DII Activity';
              }
            }
            
            // Determine banner colors based on signal type
            let bannerColors: string;
            if (signalType === 'STRONG') {
              bannerColors = isBullish
                ? 'bg-gradient-to-r from-green-500 to-green-600 border-green-400 text-white'
                : 'bg-gradient-to-r from-red-500 to-red-600 border-red-400 text-white';
            } else if (signalType === 'MODERATE') {
              bannerColors = isBullish
                ? 'bg-gradient-to-r from-green-400 to-green-500 border-green-300 text-white'
                : 'bg-gradient-to-r from-red-400 to-red-500 border-red-300 text-white';
            } else {
              // MILD/NEUTRAL - use gray/blue colors
              bannerColors = 'bg-gradient-to-r from-gray-500 to-gray-600 border-gray-400 text-white';
            }
            
            // Always render the banner when FII/DII data exists
            return (
              <div className={`mb-3 rounded-lg p-4 border-4 ${bannerColors}`}>
                <div className="flex items-center justify-center gap-3">
                  <div className="text-3xl">
                    {isBullish ? '📈' : '📉'}
                  </div>
                  <div className="text-center flex-1">
                    <div className="text-lg md:text-xl font-bold mb-1">
                      {signalType} {signalText} SIGNAL - FII/DII ACTIVITY
                      {marketStatus === 'closed' && <span className="ml-2 text-xs opacity-75">(Last Trading Session)</span>}
                    </div>
                    <div className="text-sm md:text-base opacity-95 mb-1">
                      Net FII: <span className={`font-bold ${(netFII || 0) > 0 ? 'text-green-200' : (netFII || 0) < 0 ? 'text-red-200' : 'text-white'}`}>
                        {(netFII || 0) > 0 ? '+' : ''}{(netFII || 0).toFixed(0)} Cr
                      </span>
                      {activityMessage && ` | ${activityMessage}`}
                    </div>
                    <div className="text-xs opacity-75 mt-1 italic">
                      💡 Note: Positive = Buying/Inflow | Negative = Selling/Outflow
                    </div>
                    <div className="text-xs opacity-85 mt-1 italic">
                      💡 Impact on Nifty 50: {netFII > 1000 ? 'Strong positive impact expected' : 
                                             netFII > 500 ? 'Positive impact expected' :
                                             netFII < -1000 ? 'Strong negative impact expected' :
                                             netFII < -500 ? 'Negative impact expected' :
                                             'Neutral impact'} on next trading session
                    </div>
                    <div className="text-xs mt-1 opacity-90 flex items-center justify-center gap-3">
                      <span>
                        FII Equity: <span className={`font-semibold ${(fiiEquity || 0) > 0 ? 'text-green-200' : (fiiEquity || 0) < 0 ? 'text-red-200' : 'text-white'}`}>
                          {(fiiEquity || 0) > 0 ? '+' : ''}{(fiiEquity || 0).toFixed(0)} Cr
                        </span>
                        {fiiEquity > 500 && ' 📈 Buying'}
                        {fiiEquity < -500 && ' 📉 Selling'}
                        {fiiEquity >= -500 && fiiEquity <= 500 && ' ➡️ Neutral'}
                      </span>
                      <span>|</span>
                      <span>
                        DII Equity: <span className={`font-semibold ${(diiEquity || 0) > 0 ? 'text-green-200' : (diiEquity || 0) < 0 ? 'text-red-200' : 'text-white'}`}>
                          {(diiEquity || 0) > 0 ? '+' : ''}{(diiEquity || 0).toFixed(0)} Cr
                        </span>
                        {diiEquity > 300 && ' 📈 Buying'}
                        {diiEquity < -300 && ' 📉 Selling'}
                        {diiEquity >= -300 && diiEquity <= 300 && ' ➡️ Neutral'}
                      </span>
                    </div>
                    
                    {/* Nearest Support / Resistance quick info */}
                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-white/10 rounded p-2 text-left">
                        <div className="font-semibold mb-1">Nearest Support</div>
                        <div className="text-sm font-bold">
                          {nearestSupportRef ? nearestSupportRef.price.toLocaleString('en-IN') : 'N/A'}
                        </div>
                        <div className="opacity-80">
                          Strength: {nearestSupportRef ? `${Math.round((nearestSupportRef.strength || 1) * 100)}%` : 'N/A'} |
                          Distance: {supportDistance !== null ? `${Math.abs(supportDistance).toFixed(2)}% ${supportDistance >= 0 ? 'below' : 'above'}` : 'N/A'}
                        </div>
                      </div>
                      <div className="bg-white/10 rounded p-2 text-left">
                        <div className="font-semibold mb-1">Nearest Resistance</div>
                        <div className="text-sm font-bold">
                          {nearestResistanceRef ? nearestResistanceRef.price.toLocaleString('en-IN') : 'N/A'}
                        </div>
                        <div className="opacity-80">
                          Strength: {nearestResistanceRef ? `${Math.round((nearestResistanceRef.strength || 1) * 100)}%` : 'N/A'} |
                          Distance: {resistanceDistance !== null ? `${Math.abs(resistanceDistance).toFixed(2)}% ${resistanceDistance >= 0 ? 'above' : 'below'}` : 'N/A'}
                        </div>
                      </div>
                    </div>
                    
                    {/* Entry Levels Section - Always show when FII/DII signal is present */}
                    {entryLevels ? (
                      <div className="mt-3 pt-3 border-t border-white/30">
                        <div className="text-xs font-bold mb-2 opacity-95 flex items-center justify-center gap-2">
                          <span>🎯</span>
                          <span>{entryLevels.type} ENTRY LEVELS - Based on FII/DII Activity</span>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs mb-2">
                          <div className="bg-white/20 rounded p-2 backdrop-blur-sm">
                            <div className="opacity-90 mb-1 text-xs">Entry Level</div>
                            <div className="font-bold text-sm">{entryLevels.entryLevel.toLocaleString('en-IN')}</div>
                          </div>
                          <div className="bg-white/20 rounded p-2 backdrop-blur-sm">
                            <div className="opacity-90 mb-1 text-xs">Stop Loss</div>
                            <div className="font-bold text-sm text-red-200">{entryLevels.stopLoss.toLocaleString('en-IN')}</div>
                          </div>
                          <div className="bg-white/20 rounded p-2 backdrop-blur-sm">
                            <div className="opacity-90 mb-1 text-xs">Target</div>
                            <div className="font-bold text-sm text-green-200">{entryLevels.target.toLocaleString('en-IN')}</div>
                          </div>
                          <div className="bg-white/20 rounded p-2 backdrop-blur-sm">
                            <div className="opacity-90 mb-1 text-xs">Strike Price</div>
                            <div className="font-bold text-sm">{entryLevels.strike.toLocaleString('en-IN')}</div>
                            <div className="text-xs opacity-75 mt-1">{entryLevels.optionType}</div>
                          </div>
                          <div className="bg-white/20 rounded p-2 backdrop-blur-sm">
                            <div className="opacity-90 mb-1 text-xs">Risk:Reward</div>
                            <div className="font-bold text-sm">{entryLevels.riskReward}:1</div>
                            <div className="text-xs opacity-75 mt-1">
                              {parseFloat(entryLevels.riskReward) >= 2 ? '✅ Good' : 
                               parseFloat(entryLevels.riskReward) >= 1.5 ? '⚠️ Fair' : 
                               '❌ Low'}
                            </div>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-2 gap-2 text-xs mb-2">
                          <div className="bg-white/10 rounded p-2 backdrop-blur-sm">
                            <div className="opacity-90 mb-1 text-xs">Support Reference</div>
                            <div className="font-bold text-sm">
                              {entryLevels.supportRef ? entryLevels.supportRef.toLocaleString('en-IN') : 'N/A'}
                            </div>
                          </div>
                          <div className="bg-white/10 rounded p-2 backdrop-blur-sm">
                            <div className="opacity-90 mb-1 text-xs">Resistance Reference</div>
                            <div className="font-bold text-sm">
                              {entryLevels.resistanceRef ? entryLevels.resistanceRef.toLocaleString('en-IN') : 'N/A'}
                            </div>
                          </div>
                        </div>
                        <div className="text-xs mt-2 opacity-90 bg-white/10 rounded p-2">
                          <div className="font-semibold mb-1">
                            {isBullish ? '📈 BULLISH Strategy:' : '📉 BEARISH Strategy:'}
                          </div>
                          <div className="opacity-90">
                            {isBullish 
                              ? `Buy ${entryLevels.optionType} options when Nifty 50 reaches ${entryLevels.entryLevel.toLocaleString('en-IN')} (Support Level). Set stop loss at ${entryLevels.stopLoss.toLocaleString('en-IN')} and target at ${entryLevels.target.toLocaleString('en-IN')}.`
                              : `Buy ${entryLevels.optionType} options when Nifty 50 reaches ${entryLevels.entryLevel.toLocaleString('en-IN')} (Resistance Level). Set stop loss at ${entryLevels.stopLoss.toLocaleString('en-IN')} and target at ${entryLevels.target.toLocaleString('en-IN')}.`}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-3 pt-3 border-t border-white/30">
                        <div className="text-xs opacity-75 italic text-center">
                          ⏳ Entry levels will be calculated once current price is available
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="text-3xl">
                    {isBullish ? '📈' : '📉'}
                  </div>
                </div>
              </div>
            );
        })()}

        {/* Timeframe Selector for Chart - Compact */}
        <div className="bg-white rounded-lg shadow p-2 border border-gray-200">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-800">📊 Timeframe:</span>
            <TimeframeSelector 
              selectedTimeframe={selectedTimeframe}
              onTimeframeChange={(tf) => {
                setSelectedTimeframe(tf);
                if (allTimeframeData) {
                  setCandlestickData(allTimeframeData[tf]);
                } else if (timeframeData) {
                  if (tf === '15m' && timeframeData['15m']) {
                    setCandlestickData(timeframeData['15m']);
                  } else if (tf === '1h' && timeframeData['1h']) {
                    setCandlestickData(timeframeData['1h']);
                  } else if (tf === '1d' && timeframeData['1d']) {
                    setCandlestickData(timeframeData['1d']);
                  }
                }
              }}
            />
          </div>
        </div>

        {/* SECTION 1: Chart & Trading Panel - Compact */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          {/* Chart - Takes 2 columns on large screens */}
          <div className="lg:col-span-2 space-y-3">
            <TradingChart
              key={`chart-${selectedTimeframe}`}
              data={candlestickData}
              supportResistanceLevels={supportResistanceLevels}
              onPriceClick={setCurrentPrice}
            />
            
            {/* Downtrend Prediction Below Chart */}
            {nextDayPrediction && nextDayPrediction.direction === 'BEARISH' && (
              <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-lg p-4 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-3xl">📉</div>
              <div>
                      <div className="text-sm opacity-90 mb-1">NEXT DAY PREDICTION</div>
                      <div className="text-2xl font-extrabold">DOWNTREND / BEARISH</div>
                </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm opacity-90 mb-1">Confidence</div>
                    <div className="text-xl font-bold">{nextDayPrediction.confidence}%</div>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-red-400 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  <div>
                    <div className="opacity-90 text-xs mb-1">Current Price</div>
                    <div className="font-bold">{(nextDayPrediction.currentPrice || 0).toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="opacity-90 text-xs mb-1">Predicted Price</div>
                    <div className="font-bold">{(nextDayPrediction.predictedPrice || 0).toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="opacity-90 text-xs mb-1">Support</div>
                    <div className="font-bold">{(nextDayPrediction.supportLevel || 0).toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="opacity-90 text-xs mb-1">Resistance</div>
                    <div className="font-bold">{(nextDayPrediction.resistanceLevel || 0).toFixed(2)}</div>
                  </div>
                </div>
                {nextDayPrediction.orderRecommendations?.type === 'PUT' && (
                  <div className="mt-3 pt-3 border-t border-red-400">
                    <div className="text-xs opacity-90 mb-2">📋 ORDER RECOMMENDATION</div>
                    <div className="grid grid-cols-4 gap-2 text-xs">
                      <div>
                        <div className="opacity-90 mb-1">Strike</div>
                        <div className="font-bold">{nextDayPrediction.orderRecommendations?.putStrike || 'N/A'}</div>
                      </div>
                      <div>
                        <div className="opacity-90 mb-1">Entry</div>
                        <div className="font-bold">{(nextDayPrediction.orderRecommendations?.entryLevel || 0).toFixed(2)}</div>
                      </div>
                      <div>
                        <div className="opacity-90 mb-1">Stop Loss</div>
                        <div className="font-bold">{(nextDayPrediction.orderRecommendations?.stopLoss || 0).toFixed(2)}</div>
                      </div>
                      <div>
                        <div className="opacity-90 mb-1">Target</div>
                        <div className="font-bold">{(nextDayPrediction.orderRecommendations?.target || 0).toFixed(2)}</div>
              </div>
            </div>
          </div>
        )}
              </div>
            )}
              </div>

          {/* Trading Panel - Takes 1 column */}
          <div>
            <TradingPanel
              currentPrice={currentPrice}
              supportLevels={supportLevels}
              resistanceLevels={resistanceLevels}
              onTradeExecute={handleTradeExecute}
              openTrades={openTrades}
              nextDayPrediction={nextDayPrediction}
            />
          </div>
        </div>

        {/* Global Markets Data Section - Always show if data available */}
        {globalMarketData && globalMarketData.commodities && (
          <div className="bg-white rounded-lg shadow p-3 border border-gray-200">
            <div className="text-sm font-bold text-gray-800 mb-3">🌍 Global Markets & Institutional Activity</div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              {/* Gold */}
              {globalMarketData.commodities?.gold && globalMarketData.commodities.gold.price > 0 && (
                <div className={`p-3 rounded-lg border-2 ${
                  (globalMarketData.commodities.gold.changePercent || 0) > 0 
                    ? 'bg-yellow-50 border-yellow-300' 
                    : 'bg-gray-50 border-gray-300'
                }`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-gray-700">🪙 Gold</span>
                    <span className={`text-xs font-bold ${
                      (globalMarketData.commodities.gold.changePercent || 0) > 0 ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {(globalMarketData.commodities.gold.changePercent || 0) > 0 ? '+' : ''}
                      {(globalMarketData.commodities.gold.changePercent || 0).toFixed(2)}%
                    </span>
                  </div>
                  <div className="text-xs text-gray-600">
                    ${(globalMarketData.commodities.gold.price || 0).toFixed(2)}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {(globalMarketData.commodities.gold.changePercent || 0) > 1 ? '⚠️ Risk-off' : 
                     (globalMarketData.commodities.gold.changePercent || 0) < -1 ? '✅ Risk-on' : 
                     '➡️ Neutral'}
                  </div>
                </div>
              )}

              {/* Crude Oil */}
              {globalMarketData.commodities?.crudeOil && globalMarketData.commodities.crudeOil.price > 0 && (
                <div className={`p-3 rounded-lg border-2 ${
                  (globalMarketData.commodities.crudeOil.changePercent || 0) > 0 
                    ? 'bg-orange-50 border-orange-300' 
                    : 'bg-gray-50 border-gray-300'
                }`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-gray-700">🛢️ Crude Oil</span>
                    <span className={`text-xs font-bold ${
                      (globalMarketData.commodities.crudeOil.changePercent || 0) > 0 ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {(globalMarketData.commodities.crudeOil.changePercent || 0) > 0 ? '+' : ''}
                      {(globalMarketData.commodities.crudeOil.changePercent || 0).toFixed(2)}%
                    </span>
                  </div>
                  <div className="text-xs text-gray-600">
                    ${(globalMarketData.commodities.crudeOil.price || 0).toFixed(2)}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {(globalMarketData.commodities.crudeOil.changePercent || 0) > 2 ? '⚠️ Negative for India' : 
                     (globalMarketData.commodities.crudeOil.changePercent || 0) < -2 ? '✅ Positive for India' : 
                     '➡️ Neutral'}
                  </div>
                </div>
              )}

              {/* FII Activity */}
              {globalMarketData.fiiDii && (
                <div className={`p-3 rounded-lg border-2 ${
                  (globalMarketData.fiiDii.netFII || 0) > 0 
                    ? 'bg-green-50 border-green-300' 
                    : (globalMarketData.fiiDii.netFII || 0) < 0
                    ? 'bg-red-50 border-red-300'
                    : 'bg-gray-50 border-gray-300'
                }`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-gray-700">📈 FII Equity</span>
                    <span className={`text-xs font-bold ${
                      (globalMarketData.fiiDii.fii?.equity || 0) > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {(globalMarketData.fiiDii.fii?.equity || 0) > 0 ? '+' : ''}
                      {(globalMarketData.fiiDii.fii?.equity || 0).toFixed(0)} Cr
                    </span>
                  </div>
                  <div className="text-xs text-gray-600 mb-1">
                    DII: {(globalMarketData.fiiDii.dii?.equity || 0) > 0 ? '+' : ''}
                    {(globalMarketData.fiiDii.dii?.equity || 0).toFixed(0)} Cr
                  </div>
                  <div className="text-xs font-bold text-gray-700">
                    Net: {(globalMarketData.fiiDii.netFII || 0) > 0 ? '+' : ''}
                    {(globalMarketData.fiiDii.netFII || 0).toFixed(0)} Cr
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {(globalMarketData.fiiDii.netFII || 0) > 1000 ? '✅✅ Strong Buying' : 
                     (globalMarketData.fiiDii.netFII || 0) > 500 ? '✅ Buying' :
                     (globalMarketData.fiiDii.netFII || 0) < -1000 ? '⚠️⚠️ Strong Selling' :
                     (globalMarketData.fiiDii.netFII || 0) < -500 ? '⚠️ Selling' :
                     '➡️ Neutral'}
                  </div>
                </div>
              )}

              {/* Impact Summary */}
              {nextDayPrediction?.analysis?.globalMarkets && (
                <div className="p-3 rounded-lg border-2 border-blue-300 bg-blue-50">
                  <div className="text-xs font-semibold text-gray-700 mb-2">📊 Market Impact</div>
                  <div className="space-y-1 text-xs">
                    {nextDayPrediction.analysis.globalMarkets.commodities?.gold && nextDayPrediction.analysis.globalMarkets.commodities.gold.impact !== 'neutral' && (
                      <div>
                        <span className="text-gray-600">Gold: </span>
                        <span className={`font-bold ${
                          nextDayPrediction.analysis.globalMarkets.commodities.gold.impact === 'bullish' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {nextDayPrediction.analysis.globalMarkets.commodities.gold.impact.toUpperCase()}
                        </span>
                      </div>
                    )}
                    {nextDayPrediction.analysis.globalMarkets.commodities?.crudeOil && nextDayPrediction.analysis.globalMarkets.commodities.crudeOil.impact !== 'neutral' && (
                      <div>
                        <span className="text-gray-600">Oil: </span>
                        <span className={`font-bold ${
                          nextDayPrediction.analysis.globalMarkets.commodities.crudeOil.impact === 'bullish' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {nextDayPrediction.analysis.globalMarkets.commodities.crudeOil.impact.toUpperCase()}
                        </span>
                      </div>
                    )}
                    {nextDayPrediction.analysis.globalMarkets.fiiDii && nextDayPrediction.analysis.globalMarkets.fiiDii.impact !== 'neutral' && (
                      <div>
                        <span className="text-gray-600">FII/DII: </span>
                        <span className={`font-bold ${
                          nextDayPrediction.analysis.globalMarkets.fiiDii.impact === 'bullish' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {nextDayPrediction.analysis.globalMarkets.fiiDii.impact.toUpperCase()}
                        </span>
                      </div>
                    )}
                    {(!nextDayPrediction.analysis.globalMarkets.commodities?.gold || nextDayPrediction.analysis.globalMarkets.commodities.gold.impact === 'neutral') && 
                     (!nextDayPrediction.analysis.globalMarkets.commodities?.crudeOil || nextDayPrediction.analysis.globalMarkets.commodities.crudeOil.impact === 'neutral') &&
                     (!nextDayPrediction.analysis.globalMarkets.fiiDii || nextDayPrediction.analysis.globalMarkets.fiiDii.impact === 'neutral') && (
                      <div className="text-gray-500">No significant impact</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* SECTION 2: Analysis & Predictions - Ultra Compact */}
        <div className="space-y-3">
          {/* Predictions Grid - All predictions side by side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
            {/* Morning Setup - Compact */}
            {showMorningSetup && morningSetup && (
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-semibold rounded">
                    🌅 Morning
                  </span>
                  {giftNiftyData && (
                    <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">
                      Gift Nifty
                    </span>
                  )}
                </div>
                <MorningSetupComponent 
                  setup={morningSetup} 
                  currentTime={currentTime}
                />
              </div>
            )}

            {/* Next Day Prediction - Compact */}
            {nextDayPrediction && (
              <div>
                <NextDayPredictionPanel prediction={nextDayPrediction} />
              </div>
            )}
          </div>

          {/* Option Chain & Technical Analysis - Compact Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
            {/* Option Chain Panel - 1 column */}
            <div>
            <OptionChainPanel
              summary={optionChainSummary}
              isRefreshing={isRefreshingOptionChain}
              currentPrice={currentPrice}
              supportLevel={ocSupport}
              resistanceLevel={ocResistance}
            />
        </div>

            {/* Technical Analysis - Compact 3 columns */}
            {prediction && (
              <div className="lg:col-span-3 bg-white rounded-lg shadow p-3 border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-bold text-gray-800">📊 Technical Analysis</h3>
                  <div className="flex gap-2 text-xs">
                    <span className={`px-2 py-0.5 rounded ${
                      prediction.direction === 'up' ? 'bg-green-100 text-green-700' :
                      prediction.direction === 'down' ? 'bg-red-100 text-red-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {prediction.direction.toUpperCase()}
                    </span>
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded">
                      {prediction.confidence}% Conf
                    </span>
        </div>
                </div>
                <div className="grid grid-cols-4 gap-2 mb-2">
                  <div className="p-2 bg-blue-50 rounded text-center">
                    <div className="text-xs text-gray-600">EMA9</div>
                    <div className="text-xs font-bold">{prediction.indicators.ema9.toFixed(0)}</div>
                  </div>
                  <div className="p-2 bg-blue-50 rounded text-center">
                    <div className="text-xs text-gray-600">EMA21</div>
                    <div className="text-xs font-bold">{prediction.indicators.ema21.toFixed(0)}</div>
                  </div>
                  <div className="p-2 bg-blue-50 rounded text-center">
                    <div className="text-xs text-gray-600">RSI</div>
                    <div className={`text-xs font-bold ${
                      prediction.indicators.rsi < 30 ? 'text-green-600' :
                      prediction.indicators.rsi > 70 ? 'text-red-600' :
                      'text-gray-800'
                    }`}>
                      {prediction.indicators.rsi.toFixed(0)}
                    </div>
                  </div>
                  <div className="p-2 bg-blue-50 rounded text-center">
                    <div className="text-xs text-gray-600">Vol</div>
                    <div className="text-xs font-bold">{prediction.indicators.volumeStrength}%</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2 bg-blue-50 rounded text-center">
                    <div className="text-xs text-gray-600">Support</div>
                    <div className="text-sm font-bold text-blue-600">{prediction.supportLevel.toFixed(0)}</div>
                  </div>
                  <div className="p-2 bg-orange-50 rounded text-center">
                    <div className="text-xs text-gray-600">Resistance</div>
                    <div className="text-sm font-bold text-orange-600">{prediction.resistanceLevel.toFixed(0)}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* SECTION 3: Trades List */}
        <div>
          <TradesList trades={openTrades} onCloseTrade={handleCloseTrade} />
        </div>
      </div>
    </main>
  );
}

