'use client';

import { Prediction } from '@/utils/prediction';

interface PredictionPanelProps {
  prediction: Prediction | null;
  currentPrice: number;
}

export default function PredictionPanel({ prediction, currentPrice }: PredictionPanelProps) {
  if (!prediction) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-4">Next Day Prediction</h2>
        <p className="text-gray-500">Calculating prediction...</p>
      </div>
    );
  }

  const priceChange = prediction.nextDayPrice - currentPrice;
  const priceChangePercent = currentPrice > 0 ? (priceChange / currentPrice) * 100 : 0;

  // Safety check for indicators - MUST be declared first
  const indicators = (prediction.indicators && typeof prediction.indicators === 'object') ? prediction.indicators : {
    ema9: 0,
    ema21: 0,
    ema50: 0,
    rsi: 50,
    volumeStrength: 0,
    volumeTrend: 'neutral' as 'increasing' | 'decreasing' | 'neutral',
  };

  // Ensure all indicator values are valid numbers
  const safeIndicators = {
    ema9: Number.isFinite(indicators.ema9) ? indicators.ema9 : 0,
    ema21: Number.isFinite(indicators.ema21) ? indicators.ema21 : 0,
    ema50: Number.isFinite(indicators.ema50) ? indicators.ema50 : 0,
    rsi: Number.isFinite(indicators.rsi) ? Math.max(0, Math.min(100, indicators.rsi)) : 50,
    volumeStrength: Number.isFinite(indicators.volumeStrength) ? Math.max(0, Math.min(100, indicators.volumeStrength)) : 0,
    volumeTrend: indicators.volumeTrend || 'neutral',
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold mb-4">Next Day Prediction</h2>
      
      <div className="space-y-4">
        {/* Current vs Predicted Price */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-600 mb-1">Current Price</div>
            <div className="text-2xl font-bold">{currentPrice.toFixed(2)}</div>
          </div>
          <div className={`p-4 rounded-lg ${
            prediction.direction === 'up' ? 'bg-green-50' : 
            prediction.direction === 'down' ? 'bg-red-50' : 
            'bg-gray-50'
          }`}>
            <div className="text-sm text-gray-600 mb-1">Predicted Price</div>
            <div className={`text-2xl font-bold ${
              prediction.direction === 'up' ? 'text-green-600' : 
              prediction.direction === 'down' ? 'text-red-600' : 
              'text-gray-600'
            }`}>
              {prediction.nextDayPrice.toFixed(2)}
            </div>
          </div>
        </div>

        {/* Price Change */}
        <div className={`p-4 rounded-lg ${
          priceChange >= 0 ? 'bg-green-50 border-2 border-green-200' : 'bg-red-50 border-2 border-red-200'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600">Expected Change</div>
              <div className={`text-xl font-bold ${
                priceChange >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)} 
                <span className="text-sm ml-2">
                  ({priceChangePercent >= 0 ? '+' : ''}{priceChangePercent.toFixed(2)}%)
                </span>
              </div>
            </div>
            <div className={`text-3xl ${
              prediction.direction === 'up' ? 'text-green-600' : 
              prediction.direction === 'down' ? 'text-red-600' : 
              'text-gray-600'
            }`}>
              {prediction.direction === 'up' ? '📈' : 
               prediction.direction === 'down' ? '📉' : 
               '➡️'}
            </div>
          </div>
        </div>

        {/* Confidence */}
        <div className="p-4 bg-blue-50 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Confidence Level</span>
            <span className="text-sm font-bold text-blue-600">{prediction.confidence}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{ width: `${prediction.confidence}%` }}
            />
          </div>
        </div>

        {/* Technical Indicators: EMA, RSI, Volume */}
        <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border-2 border-purple-200">
          <div className="text-sm font-bold text-gray-800 mb-3">📊 Technical Indicators</div>
          
          {/* EMA Indicators */}
          <div className="mb-4">
            <div className="text-xs font-semibold text-gray-700 mb-2">EMA (Exponential Moving Average)</div>
            <div className="grid grid-cols-3 gap-2">
              <div className={`p-2 rounded ${
                currentPrice > safeIndicators.ema9 ? 'bg-green-100' : 'bg-red-100'
              }`}>
                <div className="text-xs text-gray-600">EMA 9</div>
                <div className="text-sm font-bold">{safeIndicators.ema9.toFixed(2)}</div>
                <div className="text-xs">
                  {currentPrice > safeIndicators.ema9 ? '🟢 Above' : '🔴 Below'}
                </div>
              </div>
              <div className={`p-2 rounded ${
                currentPrice > safeIndicators.ema21 ? 'bg-green-100' : 'bg-red-100'
              }`}>
                <div className="text-xs text-gray-600">EMA 21</div>
                <div className="text-sm font-bold">{safeIndicators.ema21.toFixed(2)}</div>
                <div className="text-xs">
                  {currentPrice > safeIndicators.ema21 ? '🟢 Above' : '🔴 Below'}
                </div>
              </div>
              <div className={`p-2 rounded ${
                currentPrice > safeIndicators.ema50 ? 'bg-green-100' : 'bg-red-100'
              }`}>
                <div className="text-xs text-gray-600">EMA 50</div>
                <div className="text-sm font-bold">{safeIndicators.ema50.toFixed(2)}</div>
                <div className="text-xs">
                  {currentPrice > safeIndicators.ema50 ? '🟢 Above' : '🔴 Below'}
                </div>
              </div>
            </div>
            {/* EMA Alignment Status */}
            <div className="mt-2 text-xs">
              {safeIndicators.ema9 > safeIndicators.ema21 && 
               safeIndicators.ema21 > safeIndicators.ema50 ? (
                <span className="text-green-700 font-semibold">✅ Bullish EMA Alignment (9 &gt; 21 &gt; 50)</span>
              ) : safeIndicators.ema9 < safeIndicators.ema21 && 
                  safeIndicators.ema21 < safeIndicators.ema50 ? (
                <span className="text-red-700 font-semibold">✅ Bearish EMA Alignment (9 &lt; 21 &lt; 50)</span>
              ) : (
                <span className="text-yellow-700 font-semibold">⚠️ Mixed EMA Signals</span>
              )}
            </div>
          </div>

          {/* RSI Indicator */}
          <div className="mb-4">
            <div className="text-xs font-semibold text-gray-700 mb-2">RSI (Relative Strength Index)</div>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="flex justify-between text-xs mb-1">
                  <span>RSI: <strong>{safeIndicators.rsi.toFixed(1)}</strong></span>
                  <span className={`font-semibold ${
                    safeIndicators.rsi < 30 ? 'text-green-600' :
                    safeIndicators.rsi > 70 ? 'text-red-600' :
                    'text-gray-600'
                  }`}>
                    {safeIndicators.rsi < 30 ? 'Oversold' :
                     safeIndicators.rsi > 70 ? 'Overbought' :
                     'Neutral'}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 relative">
                  <div 
                    className={`h-3 rounded-full transition-all ${
                      safeIndicators.rsi < 30 ? 'bg-green-500' :
                      safeIndicators.rsi > 70 ? 'bg-red-500' :
                      'bg-blue-500'
                    }`}
                    style={{ width: `${safeIndicators.rsi}%` }}
                  />
                  <div className="absolute inset-0 flex justify-between items-center px-1 text-xs text-gray-600">
                    <span>0</span>
                    <span className="font-semibold">30</span>
                    <span className="font-semibold">50</span>
                    <span className="font-semibold">70</span>
                    <span>100</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Volume Strength */}
          <div>
            <div className="text-xs font-semibold text-gray-700 mb-2">Volume Analysis</div>
            <div className="grid grid-cols-2 gap-3">
              <div className={`p-3 rounded-lg ${
                safeIndicators.volumeStrength > 70 ? 'bg-green-100 border-2 border-green-300' :
                safeIndicators.volumeStrength > 50 ? 'bg-yellow-100 border border-yellow-300' :
                'bg-red-100 border border-red-300'
              }`}>
                <div className="text-xs text-gray-600 mb-1">Volume Strength</div>
                <div className={`text-lg font-bold ${
                  safeIndicators.volumeStrength > 70 ? 'text-green-700' :
                  safeIndicators.volumeStrength > 50 ? 'text-yellow-700' :
                  'text-red-700'
                }`}>
                  {safeIndicators.volumeStrength}%
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div 
                    className={`h-2 rounded-full ${
                      safeIndicators.volumeStrength > 70 ? 'bg-green-500' :
                      safeIndicators.volumeStrength > 50 ? 'bg-yellow-500' :
                      'bg-red-500'
                    }`}
                    style={{ width: `${safeIndicators.volumeStrength}%` }}
                  />
                </div>
                <div className="text-xs mt-1">
                  {safeIndicators.volumeStrength > 70 ? '✅ Strong' :
                   safeIndicators.volumeStrength > 50 ? '⚠️ Moderate' :
                   '❌ Weak'}
                </div>
              </div>
              <div className={`p-3 rounded-lg ${
                safeIndicators.volumeTrend === 'increasing' ? 'bg-green-100 border-2 border-green-300' :
                safeIndicators.volumeTrend === 'decreasing' ? 'bg-red-100 border border-red-300' :
                'bg-gray-100 border border-gray-300'
              }`}>
                <div className="text-xs text-gray-600 mb-1">Volume Trend</div>
                <div className={`text-lg font-bold ${
                  safeIndicators.volumeTrend === 'increasing' ? 'text-green-700' :
                  safeIndicators.volumeTrend === 'decreasing' ? 'text-red-700' :
                  'text-gray-700'
                }`}>
                  {safeIndicators.volumeTrend === 'increasing' ? '📈 Increasing' :
                   safeIndicators.volumeTrend === 'decreasing' ? '📉 Decreasing' :
                   '➡️ Neutral'}
                </div>
                <div className="text-xs mt-2">
                  {safeIndicators.volumeTrend === 'increasing' ? '✅ Confirms move' :
                   safeIndicators.volumeTrend === 'decreasing' ? '⚠️ Weakens signal' :
                   '➡️ No clear trend'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Support/Resistance */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 bg-blue-50 rounded-lg">
            <div className="text-xs text-gray-600 mb-1">Support Level</div>
            <div className="text-lg font-bold text-blue-600">{prediction.supportLevel.toFixed(2)}</div>
          </div>
          <div className="p-3 bg-orange-50 rounded-lg">
            <div className="text-xs text-gray-600 mb-1">Resistance Level</div>
            <div className="text-lg font-bold text-orange-600">{prediction.resistanceLevel.toFixed(2)}</div>
          </div>
        </div>

        {/* Reasoning */}
        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="text-sm font-semibold text-gray-700 mb-2">Analysis Factors:</div>
          <ul className="space-y-1">
            {prediction.reasoning.map((reason, index) => (
              <li key={index} className="text-xs text-gray-600 flex items-start">
                <span className="text-blue-500 mr-2">•</span>
                <span>{reason}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Disclaimer */}
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-xs text-yellow-800">
            ⚠️ <strong>Disclaimer:</strong> This is a technical analysis prediction based on historical data. 
            Past performance does not guarantee future results. Always do your own research.
          </p>
        </div>
      </div>
    </div>
  );
}
