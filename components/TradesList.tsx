'use client';

import { OptionTrade } from '@/types/trading';

interface TradesListProps {
  trades: OptionTrade[];
  onCloseTrade: (tradeId: string) => void;
}

export default function TradesList({ trades, onCloseTrade }: TradesListProps) {
  if (trades.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-4">Nifty 50 Open Positions</h2>
        <p className="text-gray-500">No open positions</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold mb-4">Nifty 50 Open Positions</h2>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-2 px-4 text-sm font-semibold text-gray-700">Type</th>
              <th className="text-left py-2 px-4 text-sm font-semibold text-gray-700">Strike</th>
              <th className="text-left py-2 px-4 text-sm font-semibold text-gray-700">Entry</th>
              <th className="text-left py-2 px-4 text-sm font-semibold text-gray-700">Current</th>
              <th className="text-left py-2 px-4 text-sm font-semibold text-gray-700">Qty</th>
              <th className="text-left py-2 px-4 text-sm font-semibold text-gray-700">P&L</th>
              <th className="text-left py-2 px-4 text-sm font-semibold text-gray-700">Action</th>
            </tr>
          </thead>
          <tbody>
            {trades.map((trade) => (
              <tr key={trade.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-2 px-4">
                  <span
                    className={`px-2 py-1 rounded text-xs font-semibold ${
                      trade.type === 'call'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {trade.type.toUpperCase()}
                  </span>
                </td>
                <td className="py-2 px-4 text-sm">{trade.strikePrice.toFixed(2)}</td>
                <td className="py-2 px-4 text-sm">{trade.entryPrice.toFixed(2)}</td>
                <td className="py-2 px-4 text-sm">
                  {trade.currentPrice ? trade.currentPrice.toFixed(2) : 'N/A'}
                </td>
                <td className="py-2 px-4 text-sm">{trade.quantity}</td>
                <td className="py-2 px-4">
                  {trade.profitLoss !== undefined && (
                    <span
                      className={`text-sm font-semibold ${
                        trade.profitLoss >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      ₹{trade.profitLoss.toFixed(2)}
                    </span>
                  )}
                </td>
                <td className="py-2 px-4">
                  <button
                    onClick={() => onCloseTrade(trade.id)}
                    className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded text-xs font-medium transition-colors"
                  >
                    Close
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

