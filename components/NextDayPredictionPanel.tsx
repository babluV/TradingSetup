'use client';

import { NextDayPrediction } from '@/utils/prediction';

interface NextDayPredictionPanelProps {
  prediction: NextDayPrediction | null;
}

export default function NextDayPredictionPanel({ prediction }: NextDayPredictionPanelProps) {
  if (!prediction) {
    return (
      <div className="bg-white rounded-lg shadow p-3 border border-gray-200">
        <div className="text-sm font-bold text-gray-800 mb-2">📊 Next Day Prediction</div>
        <p className="text-xs text-gray-500">Calculating prediction...</p>
      </div>
    );
  }

  const priceChange = (prediction.predictedPrice || 0) - (prediction.currentPrice || 0);
  const priceChangePercent = (prediction.currentPrice || 0) > 0 
    ? (priceChange / (prediction.currentPrice || 1)) * 100 
    : 0;

  const isBullish = prediction.direction === 'BULLISH' || prediction.direction === 'up';
  const isBearish = prediction.direction === 'BEARISH' || prediction.direction === 'down';
  const isNeutral = !isBullish && !isBearish;

  return (
    <div className="bg-white rounded-lg shadow p-3 border border-gray-200">
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm font-bold text-gray-800">📊 Next Day Prediction</div>
        <div className={`px-2 py-0.5 rounded text-xs font-semibold ${
          isBullish ? 'bg-green-100 text-green-700' :
          isBearish ? 'bg-red-100 text-red-700' :
          'bg-gray-100 text-gray-700'
        }`}>
          {prediction.direction?.toUpperCase() || 'NEUTRAL'}
        </div>
      </div>

      {/* Price Info */}
      <div className="grid grid-cols-2 gap-2 mb-2">
        <div className="p-2 bg-gray-50 rounded text-center">
          <div className="text-xs text-gray-600 mb-1">Current</div>
          <div className="text-sm font-bold">{(prediction.currentPrice || 0).toFixed(2)}</div>
        </div>
        <div className={`p-2 rounded text-center ${
          isBullish ? 'bg-green-50' : 
          isBearish ? 'bg-red-50' : 
          'bg-gray-50'
        }`}>
          <div className="text-xs text-gray-600 mb-1">Predicted</div>
          <div className={`text-sm font-bold ${
            isBullish ? 'text-green-600' : 
            isBearish ? 'text-red-600' : 
            'text-gray-600'
          }`}>
            {(prediction.predictedPrice || 0).toFixed(2)}
          </div>
        </div>
      </div>

      {/* Price Change */}
      <div className={`p-2 rounded mb-2 ${
        priceChange >= 0 ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
      }`}>
        <div className="flex items-center justify-between">
          <div className="text-xs text-gray-600">Expected Change</div>
          <div className={`text-xs font-bold ${
            priceChange >= 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)} 
            <span className="ml-1">
              ({priceChangePercent >= 0 ? '+' : ''}{priceChangePercent.toFixed(2)}%)
            </span>
          </div>
        </div>
      </div>

      {/* Confidence */}
      <div className="mb-2">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-gray-600">Confidence</span>
          <span className="text-xs font-bold text-blue-600">{prediction.confidence || 0}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-1.5">
          <div 
            className="bg-blue-600 h-1.5 rounded-full transition-all"
            style={{ width: `${prediction.confidence || 0}%` }}
          />
        </div>
      </div>

      {/* Support/Resistance */}
      <div className="grid grid-cols-2 gap-2 mb-2">
        <div className="p-2 bg-blue-50 rounded text-center">
          <div className="text-xs text-gray-600 mb-1">Support</div>
          <div className="text-xs font-bold text-blue-600">{(prediction.supportLevel || 0).toFixed(0)}</div>
        </div>
        <div className="p-2 bg-orange-50 rounded text-center">
          <div className="text-xs text-gray-600 mb-1">Resistance</div>
          <div className="text-xs font-bold text-orange-600">{(prediction.resistanceLevel || 0).toFixed(0)}</div>
        </div>
      </div>

      {/* Order Recommendations */}
      {prediction.orderRecommendations && (
        <div className="mt-2 pt-2 border-t border-gray-200">
          <div className="text-xs font-semibold text-gray-700 mb-1">📋 Order Recommendation</div>
          <div className="grid grid-cols-4 gap-1 text-xs">
            <div>
              <div className="text-gray-500 mb-0.5">Strike</div>
              <div className="font-bold">
                {prediction.orderRecommendations.type === 'PUT' 
                  ? (prediction.orderRecommendations.putStrike || 'N/A')
                  : (prediction.orderRecommendations.callStrike || 'N/A')}
              </div>
            </div>
            <div>
              <div className="text-gray-500 mb-0.5">Entry</div>
              <div className="font-bold">{(prediction.orderRecommendations.entryLevel || 0).toFixed(0)}</div>
            </div>
            <div>
              <div className="text-gray-500 mb-0.5">SL</div>
              <div className="font-bold text-red-600">{(prediction.orderRecommendations.stopLoss || 0).toFixed(0)}</div>
            </div>
            <div>
              <div className="text-gray-500 mb-0.5">Target</div>
              <div className="font-bold text-green-600">{(prediction.orderRecommendations.target || 0).toFixed(0)}</div>
            </div>
          </div>
          <div className="mt-1 text-xs text-gray-500">
            Type: {prediction.orderRecommendations.type}
          </div>
        </div>
      )}

      {/* Global Markets Impact */}
      {prediction.analysis?.globalMarkets && (
        <div className="mt-2 pt-2 border-t border-gray-200">
          <div className="text-xs font-semibold text-gray-700 mb-1">🌍 Market Impact</div>
          <div className="space-y-0.5 text-xs">
            {prediction.analysis.globalMarkets.commodities?.gold && 
             prediction.analysis.globalMarkets.commodities.gold.impact !== 'neutral' && (
              <div>
                <span className="text-gray-600">Gold: </span>
                <span className={`font-bold ${
                  prediction.analysis.globalMarkets.commodities.gold.impact === 'bullish' 
                    ? 'text-green-600' 
                    : 'text-red-600'
                }`}>
                  {prediction.analysis.globalMarkets.commodities.gold.impact.toUpperCase()}
                </span>
              </div>
            )}
            {prediction.analysis.globalMarkets.commodities?.crudeOil && 
             prediction.analysis.globalMarkets.commodities.crudeOil.impact !== 'neutral' && (
              <div>
                <span className="text-gray-600">Oil: </span>
                <span className={`font-bold ${
                  prediction.analysis.globalMarkets.commodities.crudeOil.impact === 'bullish' 
                    ? 'text-green-600' 
                    : 'text-red-600'
                }`}>
                  {prediction.analysis.globalMarkets.commodities.crudeOil.impact.toUpperCase()}
                </span>
              </div>
            )}
            {prediction.analysis.globalMarkets.fiiDii && 
             prediction.analysis.globalMarkets.fiiDii.impact !== 'neutral' && (
              <div>
                <span className="text-gray-600">FII/DII: </span>
                <span className={`font-bold ${
                  prediction.analysis.globalMarkets.fiiDii.impact === 'bullish' 
                    ? 'text-green-600' 
                    : 'text-red-600'
                }`}>
                  {prediction.analysis.globalMarkets.fiiDii.impact.toUpperCase()}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

