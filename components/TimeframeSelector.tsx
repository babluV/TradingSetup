'use client';

interface TimeframeSelectorProps {
  selectedTimeframe: '1m' | '5m' | '15m' | '30m' | '1h' | '4h' | '1d';
  onTimeframeChange: (timeframe: '1m' | '5m' | '15m' | '30m' | '1h' | '4h' | '1d') => void;
}

export default function TimeframeSelector({ selectedTimeframe, onTimeframeChange }: TimeframeSelectorProps) {
  const timeframes: Array<{ value: '1m' | '5m' | '15m' | '30m' | '1h' | '4h' | '1d'; label: string; description: string }> = [
    { value: '1m', label: '1 Min', description: 'Ultra short-term' },
    { value: '5m', label: '5 Min', description: 'Very short-term' },
    { value: '15m', label: '15 Min', description: 'Short-term' },
    { value: '30m', label: '30 Min', description: 'Short-medium' },
    { value: '1h', label: '1 Hour', description: 'Medium-term' },
    { value: '4h', label: '4 Hours', description: 'Medium-long' },
    { value: '1d', label: '1 Day', description: 'Long-term' },
  ];

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 border border-gray-200">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-800">Timeframe Analysis</h3>
        <span className="text-xs text-gray-500">Select timeframe for analysis</span>
      </div>
      <div className="flex gap-2">
        {timeframes.map((tf) => (
          <button
            key={tf.value}
            onClick={() => onTimeframeChange(tf.value)}
            className={`flex-1 px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
              selectedTimeframe === tf.value
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <div className="font-bold">{tf.label}</div>
            <div className="text-xs opacity-75">{tf.description}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

