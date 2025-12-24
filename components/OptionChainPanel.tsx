'use client';

import { OptionChainSummary } from '@/types/optionChain';
import { SupportResistanceLevel } from '@/types/trading';

interface OptionChainPanelProps {
  summary: OptionChainSummary | null;
  isRefreshing: boolean;
  currentPrice: number;
  supportLevel: SupportResistanceLevel | null;
  resistanceLevel: SupportResistanceLevel | null;
}

export default function OptionChainPanel({
  summary,
  isRefreshing,
  currentPrice,
  supportLevel,
  resistanceLevel,
}: OptionChainPanelProps) {
  if (!summary) {
    return (
      <div className="bg-white rounded-lg shadow p-3 border border-gray-200">
        <div className="text-sm font-bold text-gray-800 mb-2">📊 Option Chain</div>
        <p className="text-xs text-gray-500">Loading option chain data...</p>
      </div>
    );
  }

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'bullish':
        return 'bg-green-100 text-green-700';
      case 'bearish':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getPCRColor = (pcr: number) => {
    if (pcr > 1.2) return 'text-green-600';
    if (pcr < 0.8) return 'text-red-600';
    return 'text-gray-600';
  };

  return (
    <div className="bg-white rounded-lg shadow p-3 border border-gray-200">
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm font-bold text-gray-800">📊 Option Chain</div>
        {isRefreshing && (
          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
        )}
      </div>

      {/* Sentiment */}
      <div className="mb-2">
        <div className={`px-2 py-1 rounded text-xs font-semibold inline-block ${getSentimentColor(summary.sentiment)}`}>
          {summary.sentiment.toUpperCase()}
        </div>
      </div>

      {/* PCR Values */}
      <div className="grid grid-cols-2 gap-2 mb-2">
        <div className="p-2 bg-gray-50 rounded">
          <div className="text-xs text-gray-600 mb-1">PCR (OI)</div>
          <div className={`text-sm font-bold ${getPCRColor(summary.pcrOI)}`}>
            {summary.pcrOI.toFixed(2)}
          </div>
        </div>
        <div className="p-2 bg-gray-50 rounded">
          <div className="text-xs text-gray-600 mb-1">PCR (Volume)</div>
          <div className={`text-sm font-bold ${getPCRColor(summary.pcrVolume)}`}>
            {summary.pcrVolume.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Bullish Strength */}
      <div className="mb-2">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-gray-600">Bullish Strength</span>
          <span className="text-xs font-bold text-blue-600">
            {Math.round(summary.bullishStrength * 100)}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-1.5">
          <div 
            className="bg-blue-600 h-1.5 rounded-full transition-all"
            style={{ width: `${summary.bullishStrength * 100}%` }}
          />
        </div>
      </div>

      {/* Current Price & Levels */}
      {currentPrice > 0 && (
        <div className="mb-2 pt-2 border-t border-gray-200">
          <div className="text-xs text-gray-600 mb-1">Current Price</div>
          <div className="text-sm font-bold text-gray-800">{currentPrice.toFixed(2)}</div>
          {supportLevel && (
            <div className="text-xs text-gray-500 mt-1">
              Support: {supportLevel.price.toFixed(2)}
            </div>
          )}
          {resistanceLevel && (
            <div className="text-xs text-gray-500">
              Resistance: {resistanceLevel.price.toFixed(2)}
            </div>
          )}
        </div>
      )}

      {/* Top Calls & Puts */}
      {(summary.topCalls.length > 0 || summary.topPuts.length > 0) && (
        <div className="mt-2 pt-2 border-t border-gray-200">
          <div className="text-xs font-semibold text-gray-700 mb-1">Top Activity</div>
          <div className="space-y-1">
            {summary.topCalls.slice(0, 2).map((call, idx) => (
              <div key={idx} className="text-xs text-gray-600">
                <span className="text-green-600 font-semibold">CALL</span> {call.strikePrice} 
                <span className="ml-1">OI: {call.openInterest.toLocaleString()}</span>
              </div>
            ))}
            {summary.topPuts.slice(0, 2).map((put, idx) => (
              <div key={idx} className="text-xs text-gray-600">
                <span className="text-red-600 font-semibold">PUT</span> {put.strikePrice} 
                <span className="ml-1">OI: {put.openInterest.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Timestamp */}
      {summary.timestamp && (
        <div className="mt-2 pt-2 border-t border-gray-200">
          <div className="text-xs text-gray-400">
            Updated: {new Date(summary.timestamp).toLocaleTimeString()}
          </div>
        </div>
      )}
    </div>
  );
}
