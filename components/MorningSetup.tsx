'use client';

import { MorningSetup } from '@/utils/morningSetup';

interface MorningSetupProps {
  setup: MorningSetup | null;
  currentTime?: Date;
  currentPrice?: number;
  marketStatus?: 'pre-market' | 'open' | 'closed';
}

export default function MorningSetupPanel({ 
  setup, 
  currentTime, 
  currentPrice = 0,
  marketStatus = 'pre-market'
}: MorningSetupProps) {
  if (!setup) {
    return (
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg shadow-lg p-6 border-2 border-blue-200">
        <h2 className="text-2xl font-bold mb-4">🌅 Morning Setup (Pre-Market)</h2>
        <p className="text-gray-500">Analyzing previous day&apos;s data...</p>
      </div>
    );
  }

  const getTrendColor = () => {
    if (setup.trend === 'uptrend') return 'text-green-600 bg-green-50 border-green-300';
    if (setup.trend === 'downtrend') return 'text-red-600 bg-red-50 border-red-300';
    return 'text-yellow-600 bg-yellow-50 border-yellow-300';
  };

  const getSuggestionColor = () => {
    if (setup.suggestion === 'buy_call') return 'bg-green-500 hover:bg-green-600';
    if (setup.suggestion === 'buy_put') return 'bg-red-500 hover:bg-red-600';
    return 'bg-gray-400 hover:bg-gray-500';
  };

  const getSuggestionText = () => {
    if (setup.suggestion === 'buy_call') return '📈 BUY CALL OPTIONS';
    if (setup.suggestion === 'buy_put') return '📉 BUY PUT OPTIONS';
    return '⏸️ WAIT FOR CLEAR SIGNAL';
  };

  return (
    <div className="bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 rounded-lg shadow-xl p-6 border-2 border-blue-300">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-1">
            🌅 Morning Setup (Pre-Market Analysis)
          </h2>
          <p className="text-sm text-gray-600">
            Market Opens: 9:15 AM IST • Analysis based on previous day&apos;s data
          </p>
        </div>
        <div className={`px-4 py-2 rounded-lg border-2 font-bold text-lg ${getTrendColor()}`}>
          {setup.trend.toUpperCase()}
        </div>
      </div>

      {/* Main Suggestion Card */}
      <div className={`p-6 rounded-lg border-2 mb-4 ${
        setup.suggestion === 'buy_call' ? 'bg-green-50 border-green-400' :
        setup.suggestion === 'buy_put' ? 'bg-red-50 border-red-400' :
        'bg-gray-50 border-gray-400'
      }`}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-sm font-semibold text-gray-700 mb-1">Trading Suggestion</div>
            <div className="text-2xl font-bold">
              {getSuggestionText()}
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm font-semibold text-gray-700 mb-1">Confidence</div>
            <div className="text-3xl font-bold">
              {setup.confidence}%
            </div>
            <div className="w-32 bg-gray-200 rounded-full h-2 mt-2">
              <div 
                className={`h-2 rounded-full ${
                  setup.confidence > 70 ? 'bg-green-500' :
                  setup.confidence > 50 ? 'bg-yellow-500' :
                  'bg-red-500'
                }`}
                style={{ width: `${setup.confidence}%` }}
              />
            </div>
          </div>
        </div>

        <div className="mt-4 p-4 bg-white rounded-lg">
          <div className="text-sm font-semibold text-gray-700 mb-2">📋 Entry Strategy:</div>
          <div className="text-sm text-gray-800">{setup.tradingStrategy.entryStrategy}</div>
        </div>
      </div>

      {/* Key Levels */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="text-xs text-gray-600 mb-1">Support Level</div>
          <div className="text-xl font-bold text-blue-600">{setup.keyLevels.support.toFixed(2)}</div>
          <div className="text-xs text-gray-500 mt-1">Buy Call Zone</div>
        </div>
        <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
          <div className="text-xs text-gray-600 mb-1">Pivot Point</div>
          <div className="text-xl font-bold text-purple-600">{setup.keyLevels.pivot.toFixed(2)}</div>
          <div className="text-xs text-gray-500 mt-1">Key Level</div>
        </div>
        <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
          <div className="text-xs text-gray-600 mb-1">Resistance Level</div>
          <div className="text-xl font-bold text-orange-600">{setup.keyLevels.resistance.toFixed(2)}</div>
          <div className="text-xs text-gray-500 mt-1">Buy Put Zone</div>
        </div>
      </div>

      {/* Trading Strategy Details */}
      {setup.suggestion !== 'wait' && (
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="p-4 bg-red-50 rounded-lg border border-red-200">
            <div className="text-xs font-semibold text-gray-700 mb-1">🛑 Stop Loss</div>
            <div className="text-lg font-bold text-red-600">{setup.tradingStrategy.stopLoss.toFixed(2)}</div>
            <div className="text-xs text-gray-500 mt-1">1.5% from entry</div>
          </div>
          <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <div className="text-xs font-semibold text-gray-700 mb-1">🎯 Target 1</div>
            <div className="text-lg font-bold text-yellow-600">{setup.tradingStrategy.target1.toFixed(2)}</div>
            <div className="text-xs text-gray-500 mt-1">2.5% profit</div>
          </div>
          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="text-xs font-semibold text-gray-700 mb-1">🎯 Target 2</div>
            <div className="text-lg font-bold text-green-600">{setup.tradingStrategy.target2.toFixed(2)}</div>
            <div className="text-xs text-gray-500 mt-1">4.0% profit</div>
          </div>
        </div>
      )}

      {/* Trend Strength */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-gray-700">Trend Strength</span>
          <span className="text-sm font-bold text-blue-600">{setup.trendStrength}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div 
            className={`h-3 rounded-full ${
              setup.trendStrength > 70 ? 'bg-green-500' :
              setup.trendStrength > 50 ? 'bg-yellow-500' :
              'bg-red-500'
            }`}
            style={{ width: `${setup.trendStrength}%` }}
          />
        </div>
      </div>

      {/* Analysis Reasoning */}
      <div className="p-4 bg-white rounded-lg border border-gray-200">
        <div className="text-sm font-semibold text-gray-700 mb-2">📊 Analysis Factors:</div>
        <ul className="space-y-1 max-h-32 overflow-y-auto">
          {setup.reasoning.map((reason, index) => (
            <li key={index} className="text-xs text-gray-600 flex items-start">
              <span className="text-blue-500 mr-2">•</span>
              <span>{reason}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Market Status */}
      <div className="mt-4 p-3 bg-indigo-50 rounded-lg border border-indigo-200">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-gray-700">Market Status</div>
            <div className="text-sm font-bold text-indigo-700">
              {marketStatus === 'pre-market' ? '⏰ Pre-Market (Before 9:15 AM)' :
               marketStatus === 'open' ? '✅ Market Open' :
               '🔒 Market Closed'}
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs font-semibold text-gray-700">Current Price</div>
            <div className="text-sm font-bold text-indigo-700">{currentPrice.toFixed(2)}</div>
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-xs text-yellow-800">
          ⚠️ <strong>Pre-Market Analysis:</strong> This analysis is based on previous day&apos;s closing data. 
          Market conditions can change rapidly after opening. Always use stop-loss and manage risk. 
          Not financial advice.
        </p>
      </div>
    </div>
  );
}

