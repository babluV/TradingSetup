'use client';

import { useEffect, useRef } from 'react';
import { createChart, IChartApi, ISeriesApi, ColorType } from 'lightweight-charts';
import { CandlestickData, SupportResistanceLevel } from '@/types/trading';

interface TradingChartProps {
  data: CandlestickData[];
  supportResistanceLevels: SupportResistanceLevel[];
  onPriceClick?: (price: number) => void;
}

export default function TradingChart({
  data,
  supportResistanceLevels,
  onPriceClick,
}: TradingChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candlestickSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const lineSeriesRefs = useRef<ISeriesApi<'Line'>[]>([]);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const hasFittedRef = useRef(false);
  const userInteractedRef = useRef(false);
  const lastDataLengthRef = useRef(0);
  const lastDataTimeRef = useRef<number | null>(null);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastScrollTimeRef = useRef<number>(0);

  // Initialize chart
  useEffect(() => {
    if (!chartContainerRef.current) {
      console.error('Chart container ref is null');
      return;
    }

    try {
      // Create chart with responsive sizing
      const chart = createChart(chartContainerRef.current, {
        layout: {
          background: { type: ColorType.Solid, color: 'white' },
          textColor: 'black',
        },
        width: chartContainerRef.current.clientWidth,
        height: 600,
        autoSize: true,
        handleScroll: {
          mouseWheel: true,
          pressedMouseMove: true,
          horzTouchDrag: true,
          vertTouchDrag: true,
        },
        handleScale: {
          axisPressedMouseMove: {
            time: true,
            price: true,
          },
          mouseWheel: true,
          pinch: true,
        },
        grid: {
          vertLines: { color: '#e0e0e0' },
          horzLines: { color: '#e0e0e0' },
        },
        crosshair: {
          mode: 1,
        },
        rightPriceScale: {
          borderColor: '#cccccc',
        },
        timeScale: {
          borderColor: '#cccccc',
          timeVisible: true,
          secondsVisible: false,
          rightOffset: 12,
          barSpacing: 3,
          fixLeftEdge: false,
          fixRightEdge: false,
        },
      });

    chartRef.current = chart;

    // Create candlestick series
    const candlestickSeries = chart.addCandlestickSeries({
      upColor: '#10b981',
      downColor: '#ef4444',
      borderVisible: false,
      wickUpColor: '#10b981',
      wickDownColor: '#ef4444',
    });

    candlestickSeriesRef.current = candlestickSeries;

    // Set up ResizeObserver for automatic resizing
    if (chartContainerRef.current) {
      resizeObserverRef.current = new ResizeObserver((entries) => {
        for (const entry of entries) {
          if (chart && entry.target === chartContainerRef.current) {
            const { width, height } = entry.contentRect;
            chart.applyOptions({
              width: width,
              height: Math.max(400, height),
            });
          }
        }
      });
      
      resizeObserverRef.current.observe(chartContainerRef.current);
    }

    // Handle window resize as fallback
    const handleResize = () => {
      if (chartContainerRef.current && chart) {
        chart.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };

    window.addEventListener('resize', handleResize);

    // Track manual interactions so we don't auto-reset zoom/pan afterwards
    const markInteraction = () => {
      userInteractedRef.current = true;
    };
    chartContainerRef.current.addEventListener('wheel', markInteraction, { passive: true });
    chartContainerRef.current.addEventListener('mousedown', markInteraction);

      return () => {
        window.removeEventListener('resize', handleResize);
        if (resizeObserverRef.current) {
          resizeObserverRef.current.disconnect();
          resizeObserverRef.current = null;
        }
        chartContainerRef.current?.removeEventListener('wheel', markInteraction);
        chartContainerRef.current?.removeEventListener('mousedown', markInteraction);
        if (scrollTimeoutRef.current) {
          clearTimeout(scrollTimeoutRef.current);
          scrollTimeoutRef.current = null;
        }
        if (chart) {
          chart.remove();
        }
      };
    } catch (error) {
      console.error('Error initializing chart:', error);
    }
  }, []);

  // Update chart data when data or timeframe changes
  useEffect(() => {
    if (!chartRef.current || !candlestickSeriesRef.current) {
      console.log('Chart not initialized yet, waiting...');
      return;
    }

    if (data.length === 0) {
      console.warn('No data to display in chart');
      return;
    }

    try {
      // Update candlestick data with comprehensive validation
      const formattedData = data
        .filter((d) => {
          // Basic validation
          if (!d || d.open <= 0 || d.close <= 0 || d.high <= 0 || d.low <= 0) {
            return false;
          }
          
          // Price range validation - Nifty 50 typically trades between 15,000 and 30,000
          // Filter out extreme outliers that could cause rendering issues
          const maxReasonablePrice = 50000;
          const minReasonablePrice = 10000;
          if (d.open > maxReasonablePrice || d.open < minReasonablePrice ||
              d.close > maxReasonablePrice || d.close < minReasonablePrice ||
              d.high > maxReasonablePrice || d.high < minReasonablePrice ||
              d.low > maxReasonablePrice || d.low < minReasonablePrice) {
            return false;
          }
          
          // OHLC integrity validation
          const maxPrice = Math.max(d.open, d.close);
          const minPrice = Math.min(d.open, d.close);
          
          // High must be >= max(open, close) and low must be <= min(open, close)
          if (d.high < maxPrice || d.low > minPrice) {
            return false;
          }
          
          // High must be >= low
          if (d.high < d.low) {
            return false;
          }
          
          // Check for extreme price movements (more than 5% in a single candle - likely data error for 5-min)
          // For 5-minute candles, typical range is 0.1-0.5%, extreme is >2%
          const priceRange = d.high - d.low;
          const avgPrice = (d.open + d.close) / 2;
          const rangePercent = (priceRange / avgPrice) * 100;
          
          // Filter out candles with more than 5% range (definitely a data error)
          if (rangePercent > 5) {
            return false;
          }
          
          // Also check if the price change (open to close) is too extreme
          const priceChange = Math.abs(d.close - d.open) / d.open;
          if (priceChange > 0.03) { // More than 3% change in 5 minutes is suspicious
            return false;
          }
          
          // Time must be valid
          if (!d.time || d.time <= 0) {
            return false;
          }
          
          return true;
        })
        .map((d) => {
          // Ensure data integrity before formatting
          const maxPrice = Math.max(d.open, d.close);
          const minPrice = Math.min(d.open, d.close);
          
          return {
          time: d.time as any,
            open: Number(d.open.toFixed(2)),
            high: Number(Math.max(d.high, maxPrice).toFixed(2)),
            low: Number(Math.min(d.low, minPrice).toFixed(2)),
            close: Number(d.close.toFixed(2)),
          };
        })
        .sort((a, b) => (a.time as number) - (b.time as number)) // Ensure chronological order
        .filter((item, index, array) => {
          // Remove duplicate timestamps (keep the last one)
          if (index > 0 && array[index - 1].time === item.time) {
            return false;
          }
          return true;
        });

      if (formattedData.length === 0) {
        console.warn('No valid data after filtering');
        return;
      }

      // Additional validation: compare each point with neighbors to detect anomalies
      const finalData = formattedData.filter((item, index) => {
        if (index === 0 || index === formattedData.length - 1) {
          // Keep first and last points, but validate them
          if (index === formattedData.length - 1) {
            // For the last point, compare with previous
            const prev = formattedData[index - 1];
            if (prev) {
              const priceChange = Math.abs(item.close - prev.close) / prev.close;
              const rangeChange = Math.abs((item.high - item.low) - (prev.high - prev.low)) / (prev.high - prev.low);
              // If price or range changes by more than 10% from previous, it's suspicious
              if (priceChange > 0.1 || rangeChange > 2.0) {
                console.warn('Filtering out anomalous last data point:', item);
                return false;
              }
            }
          }
          return true;
        }
        
        // For middle points, compare with both neighbors
        const prev = formattedData[index - 1];
        const next = formattedData[index + 1];
        
        if (prev && next) {
          const avgPrice = (prev.close + next.close) / 2;
          const priceDeviation = Math.abs(item.close - avgPrice) / avgPrice;
          
          const avgRange = ((prev.high - prev.low) + (next.high - next.low)) / 2;
          const currentRange = item.high - item.low;
          const rangeDeviation = Math.abs(currentRange - avgRange) / (avgRange || 1);
          
          // Filter out points that deviate significantly from neighbors
          if (priceDeviation > 0.15 || rangeDeviation > 3.0) {
            console.warn('Filtering out anomalous data point:', item);
            return false;
          }
        }
        
        return true;
      });

      if (finalData.length === 0) {
        console.warn('No valid data after neighbor validation');
        return;
      }

      // Log data statistics for debugging
      if (finalData.length > 0) {
        const ranges = finalData.map(d => d.high - d.low);
        const avgRange = ranges.reduce((a, b) => a + b, 0) / ranges.length;
        const maxRange = Math.max(...ranges);
        const lastRange = finalData[finalData.length - 1].high - finalData[finalData.length - 1].low;
        
        // If the last data point has an unusually large range, log it
        if (lastRange > avgRange * 3) {
          console.warn('Last data point has unusually large range:', {
            last: finalData[finalData.length - 1],
            avgRange,
            maxRange,
            lastRange
          });
          
          // If the last point is an extreme outlier, remove it
          if (lastRange > avgRange * 5) {
            console.warn('Removing extreme outlier from end of data');
            finalData.pop();
          }
        }
      }

      // Check if this is truly new data or just an update
      const latestDataTime = finalData.length > 0 ? (finalData[finalData.length - 1].time as number) : null;
      const isNewData = latestDataTime !== null && latestDataTime !== lastDataTimeRef.current;
      const isSignificantChange = Math.abs(finalData.length - lastDataLengthRef.current) > lastDataLengthRef.current * 0.2;
      
      // Reset fitting state if data length changed significantly (timeframe change)
      if (isSignificantChange) {
        hasFittedRef.current = false;
        userInteractedRef.current = false;
      }
      
      lastDataLengthRef.current = finalData.length;
      if (latestDataTime !== null) {
        lastDataTimeRef.current = latestDataTime;
      }

      // Update chart data - use setData to replace all data
      // This completely replaces all existing data
      try {
        candlestickSeriesRef.current.setData(finalData);
      } catch (error) {
        console.error('Error setting chart data:', error);
        // If setData fails, try clearing first
        try {
          candlestickSeriesRef.current.setData([]);
          candlestickSeriesRef.current.setData(finalData);
        } catch (retryError) {
          console.error('Error retrying chart data update:', retryError);
        }
      }
      
      // Auto-scroll to latest data ONLY if:
      // 1. User hasn't manually interacted
      // 2. It's truly new data (not just an update to existing data)
      // 3. Or it's a significant change (timeframe switch)
      if (!userInteractedRef.current && (isNewData || isSignificantChange)) {
        // Clear any pending scroll timeout
        if (scrollTimeoutRef.current) {
          clearTimeout(scrollTimeoutRef.current);
        }
        
        // Fit content initially or when data changes significantly
        if (!hasFittedRef.current || isSignificantChange) {
          scrollTimeoutRef.current = setTimeout(() => {
            if (chartRef.current && finalData.length > 0) {
          chartRef.current.timeScale().fitContent();
          hasFittedRef.current = true;
            }
          }, 100);
        } else if (isNewData) {
          // Only scroll if there's genuinely new data at the end
          // Debounce scroll updates (max once per second)
          const now = Date.now();
          const timeSinceLastScroll = now - lastScrollTimeRef.current;
          
          // Only proceed if enough time has passed since last scroll
          if (timeSinceLastScroll >= 1000) {
            // Check current scroll position first to avoid forcing scroll
            scrollTimeoutRef.current = setTimeout(() => {
              if (chartRef.current) {
                try {
                  const timeScale = chartRef.current.timeScale();
                  const scrollPosition = timeScale.scrollPosition();
                  
                  // Only auto-scroll if:
                  // 1. Scroll position is -1 (already at end), OR
                  // 2. Scroll position is very close to the end (within last 5 candles)
                  // This prevents forcing scroll when user is looking at historical data
                  const shouldAutoScroll = scrollPosition === -1 || 
                                          scrollPosition >= finalData.length - 5;
                  
                  if (shouldAutoScroll) {
                    timeScale.scrollToPosition(-1, false);
                    lastScrollTimeRef.current = Date.now();
                  }
                } catch (error) {
                  // If we can't get scroll position, don't force scroll
                  // User might be viewing historical data
                  console.log('Could not determine scroll position, skipping auto-scroll');
                }
              }
            }, 100);
          }
        }
      }
    } catch (error) {
      console.error('Error updating chart data:', error);
    }
    
    // Cleanup function to clear scroll timeout
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
        scrollTimeoutRef.current = null;
      }
    };
  }, [data]);

  // Update support/resistance lines
  useEffect(() => {
    if (!chartRef.current || data.length === 0) return;

    try {
      // Remove existing line series
      lineSeriesRefs.current.forEach((series) => {
        try {
          chartRef.current?.removeSeries(series);
        } catch (error) {
          // Series might already be removed
        }
      });
      lineSeriesRefs.current = [];

      // Add new support/resistance lines
      const formattedData = data
        .filter((d) => d.time && d.open > 0)
        .map((d) => ({
          time: d.time as any,
          open: d.open,
          high: d.high,
          low: d.low,
          close: d.close,
        }));

      if (formattedData.length === 0) return;

      supportResistanceLevels.forEach((level) => {
        try {
          const lineSeries = chartRef.current?.addLineSeries({
            color: level.type === 'support' ? '#3b82f6' : '#f59e0b',
            lineWidth: 2,
            lineStyle: level.strength > 0.5 ? 0 : 2,
            title: `${level.type} @ ${level.price.toFixed(2)}`,
          });

          if (lineSeries && formattedData.length > 0) {
            lineSeries.setData([
              { time: formattedData[0]?.time, value: level.price },
              { time: formattedData[formattedData.length - 1]?.time, value: level.price },
            ]);
            lineSeriesRefs.current.push(lineSeries);
          }
        } catch (error) {
          console.error('Error adding support/resistance line:', error);
        }
      });
    } catch (error) {
      console.error('Error updating support/resistance lines:', error);
    }
  }, [supportResistanceLevels, data]);

  // Handle click events
  useEffect(() => {
    if (!chartRef.current || !candlestickSeriesRef.current || !onPriceClick) return;

    const chart = chartRef.current;
    const candlestickSeries = candlestickSeriesRef.current;

    const handleClick = (param: any) => {
      if (param.point && param.seriesData) {
        const price = param.seriesData.get(candlestickSeries) as any;
        if (price) {
          onPriceClick(price.close || price.value);
        }
      }
    };

    chart.subscribeClick(handleClick);

    return () => {
      chart.unsubscribeClick(handleClick);
    };
  }, [onPriceClick]);

  // Show loading or error state
  if (data.length === 0) {
    return (
      <div className="w-full bg-white rounded-lg shadow-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">Nifty 50 Index Chart</h3>
            <p className="text-xs text-gray-500">Support (Blue) | Resistance (Orange)</p>
          </div>
        </div>
        <div className="flex items-center justify-center h-[600px] border border-gray-200 rounded">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading chart data...</p>
            <p className="text-xs text-gray-400 mt-2">Waiting for data to load</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-white rounded-lg shadow-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">Nifty 50 Index Chart</h3>
          <p className="text-xs text-gray-500">Support (Blue) | Resistance (Orange)</p>
          {data.length > 0 && (
            <p className="text-xs text-gray-400 mt-1">Data points: {data.length}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">Resize: Drag bottom edge</span>
          <div className="flex gap-1">
            <button
              onClick={() => {
                if (chartContainerRef.current) {
                  const currentHeight = chartContainerRef.current.clientHeight || 600;
                  const newHeight = Math.max(400, currentHeight - 100);
                  chartContainerRef.current.style.height = `${newHeight}px`;
                  if (chartRef.current) {
                    chartRef.current.applyOptions({ height: newHeight });
                  }
                }
              }}
              className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded transition-colors"
              title="Decrease height"
            >
              −
            </button>
            <button
              onClick={() => {
                if (chartContainerRef.current) {
                  const currentHeight = chartContainerRef.current.clientHeight || 600;
                  const newHeight = currentHeight + 100;
                  chartContainerRef.current.style.height = `${newHeight}px`;
                  if (chartRef.current) {
                    chartRef.current.applyOptions({ height: newHeight });
                  }
                }
              }}
              className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded transition-colors"
              title="Increase height"
            >
              +
            </button>
          </div>
        </div>
      </div>
      <div 
        ref={chartContainerRef} 
        className="w-full border border-gray-200 rounded relative bg-white"
        style={{ 
          height: '600px',
          minHeight: '400px',
          resize: 'vertical',
          overflow: 'hidden',
          cursor: 'default',
        }}
      />
    </div>
  );
}
