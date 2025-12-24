'use client';

import { useState } from 'react';
import { SupportResistanceLevel, OptionTrade } from '@/types/trading';
import { NextDayPrediction } from '@/utils/prediction';

interface TradingPanelProps {
  currentPrice: number;
  supportLevels: SupportResistanceLevel[];
  resistanceLevels: SupportResistanceLevel[];
  onTradeExecute: (trade: Omit<OptionTrade, 'id' | 'entryTime' | 'status'>) => void;
  openTrades: OptionTrade[];
  nextDayPrediction: NextDayPrediction | null;
}

export default function TradingPanel({
  currentPrice,
  supportLevels,
  resistanceLevels,
  onTradeExecute,
  openTrades,
  nextDayPrediction,
}: TradingPanelProps) {
  const [tradeType, setTradeType] = useState<'call' | 'put'>('call');
  const [strikePrice, setStrikePrice] = useState(currentPrice > 0 ? Math.round(currentPrice) : 0);
  const [quantity, setQuantity] = useState(1);

  // Find nearest support and resistance
  const nearestSupport = supportLevels.length > 0
    ? supportLevels.reduce((prev, curr) =>
        Math.abs(curr.price - currentPrice) < Math.abs(prev.price - currentPrice) ? curr : prev
      )
    : null;

  const nearestResistance = resistanceLevels.length > 0
    ? resistanceLevels.reduce((prev, curr) =>
        Math.abs(curr.price - currentPrice) < Math.abs(prev.price - currentPrice) ? curr : prev
      )
    : null;

  // Calculate total P&L
  const totalPnL = openTrades.reduce((sum, trade) => sum + (trade.profitLoss || 0), 0);

  const handleExecuteTrade = () => {
    if (strikePrice <= 0 || quantity <= 0) return;

    onTradeExecute({
      type: tradeType,
      strikePrice,
      entryPrice: currentPrice,
      quantity,
    });

    // Reset form
    setStrikePrice(Math.round(currentPrice));
    setQuantity(1);
  };

  // Determine if we're near support (for calls) or resistance (for puts)
  const isNearSupport = nearestSupport && Math.abs(currentPrice - nearestSupport.price) / currentPrice < 0.01;
  const isNearResistance = nearestResistance && Math.abs(currentPrice - nearestResistance.price) / currentPrice < 0.01;
  const canBuyCall = isNearSupport || (nextDayPrediction?.direction === 'BULLISH' || nextDayPrediction?.direction === 'up');
  const canBuyPut = isNearResistance || (nextDayPrediction?.direction === 'BEARISH' || nextDayPrediction?.direction === 'down');

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 border border-gray-200">
      <h3 className="text-lg font-bold text-gray-800 mb-4">📊 Trading Panel</h3>

      {/* Current Price */}
      <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
        <div className="text-xs text-gray-600 mb-1">Current Price</div>
        <div className="text-2xl font-bold text-blue-600">{currentPrice.toFixed(2)}</div>
      </div>

      {/* Support/Resistance Levels */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <div className="p-2 bg-green-50 rounded border border-green-200">
          <div className="text-xs text-gray-600 mb-1">Nearest Support</div>
          <div className="text-sm font-bold text-green-600">
            {nearestSupport ? nearestSupport.price.toFixed(2) : 'N/A'}
          </div>
        </div>
        <div className="p-2 bg-orange-50 rounded border border-orange-200">
          <div className="text-xs text-gray-600 mb-1">Nearest Resistance</div>
          <div className="text-sm font-bold text-orange-600">
            {nearestResistance ? nearestResistance.price.toFixed(2) : 'N/A'}
          </div>
        </div>
      </div>

      {/* Trade Type Selection */}
      <div className="mb-4">
        <div className="text-xs font-semibold text-gray-700 mb-2">Option Type</div>
        <div className="flex gap-2">
          <button
            onClick={() => setTradeType('call')}
            className={`flex-1 px-3 py-2 rounded font-semibold text-sm transition-colors ${
              tradeType === 'call'
                ? 'bg-green-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            📈 CALL
          </button>
          <button
            onClick={() => setTradeType('put')}
            className={`flex-1 px-3 py-2 rounded font-semibold text-sm transition-colors ${
              tradeType === 'put'
                ? 'bg-red-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            📉 PUT
          </button>
        </div>
      </div>

      {/* Strike Price */}
      <div className="mb-4">
        <label className="block text-xs font-semibold text-gray-700 mb-1">
          Strike Price
        </label>
        <input
          type="number"
          value={strikePrice}
          onChange={(e) => setStrikePrice(Number(e.target.value))}
          className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          min="0"
          step="1"
        />
        <div className="text-xs text-gray-500 mt-1">
          {tradeType === 'call' ? 'Buy calls at support' : 'Buy puts at resistance'}
        </div>
      </div>

      {/* Quantity */}
      <div className="mb-4">
        <label className="block text-xs font-semibold text-gray-700 mb-1">
          Quantity
        </label>
        <input
          type="number"
          value={quantity}
          onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
          className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          min="1"
        />
      </div>

      {/* Execute Trade Button */}
      <button
        onClick={handleExecuteTrade}
        disabled={!canBuyCall && tradeType === 'call' || !canBuyPut && tradeType === 'put'}
        className={`w-full py-3 rounded font-bold text-sm transition-colors mb-4 ${
          (tradeType === 'call' && canBuyCall) || (tradeType === 'put' && canBuyPut)
            ? tradeType === 'call'
              ? 'bg-green-500 hover:bg-green-600 text-white'
              : 'bg-red-500 hover:bg-red-600 text-white'
            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
        }`}
      >
        {tradeType === 'call' ? '📈 Buy CALL' : '📉 Buy PUT'}
      </button>

      {/* Next Day Prediction Recommendation */}
      {nextDayPrediction && (
        <div className={`mb-4 p-3 rounded border-2 ${
          nextDayPrediction.direction === 'BULLISH' || nextDayPrediction.direction === 'up'
            ? 'bg-green-50 border-green-300'
            : nextDayPrediction.direction === 'BEARISH' || nextDayPrediction.direction === 'down'
            ? 'bg-red-50 border-red-300'
            : 'bg-gray-50 border-gray-300'
        }`}>
          <div className="text-xs font-semibold text-gray-700 mb-1">💡 Prediction</div>
          <div className="text-xs text-gray-800">
            {nextDayPrediction.direction === 'BULLISH' || nextDayPrediction.direction === 'up'
              ? 'Bullish signal - Consider CALL options'
              : nextDayPrediction.direction === 'BEARISH' || nextDayPrediction.direction === 'down'
              ? 'Bearish signal - Consider PUT options'
              : 'Neutral signal - Wait for clearer direction'}
          </div>
          {nextDayPrediction.orderRecommendations && (
            <div className="mt-2 text-xs">
              <div>Entry: {nextDayPrediction.orderRecommendations.entryLevel.toFixed(2)}</div>
              <div>Target: {nextDayPrediction.orderRecommendations.target.toFixed(2)}</div>
              <div>Stop Loss: {nextDayPrediction.orderRecommendations.stopLoss.toFixed(2)}</div>
            </div>
          )}
        </div>
      )}

      {/* Total P&L */}
      <div className="pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-gray-700">Total P&L</span>
          <span className={`text-lg font-bold ${
            totalPnL >= 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            {totalPnL >= 0 ? '+' : ''}{totalPnL.toFixed(2)}
          </span>
        </div>
        <div className="text-xs text-gray-500">
          {openTrades.length} open {openTrades.length === 1 ? 'trade' : 'trades'}
        </div>
      </div>
    </div>
  );
}
