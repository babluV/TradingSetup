# Nifty 50 Options Trading Setup Web Application

A specialized web application for **Nifty 50 options trading** with automated support and resistance detection. Designed specifically for the Indian stock market (NSE).

The application follows a specific trading strategy:

- **Buy Call Options** when Nifty 50 is near **Support** levels
- **Buy Put Options** when Nifty 50 is near **Resistance** levels

## Features

- 📊 **Nifty 50 Index Chart** - Interactive candlestick chart with Nifty 50 price data (20k-25k range)
- 🎯 **Support/Resistance Detection** - Automatic identification of key Nifty 50 levels
- 📈 **Real-time Trading Panel** - Execute Nifty 50 options trades based on support/resistance
- 💼 **Position Management** - Track open positions with P&L in ₹ (Indian Rupees)
- 🎨 **Modern UI** - Clean, responsive design with Tailwind CSS
- 🇮🇳 **NSE India Focused** - Designed for National Stock Exchange of India

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

## How It Works

### Support/Resistance Detection

The application uses a pivot point algorithm to identify support and resistance levels:
- Analyzes local highs (resistance) and lows (support)
- Groups similar price levels together
- Calculates strength based on number of touches
- Displays levels on the chart with different line styles

### Trading Strategy

1. **At Support Levels**: When price approaches a support level, the system recommends buying **Call Options** (betting on price going up)

2. **At Resistance Levels**: When price approaches a resistance level, the system recommends buying **Put Options** (betting on price going down)

3. **Trading Panel**: 
   - Shows current price and nearest support/resistance levels
   - Enables/disables buy buttons based on proximity to levels
   - Allows setting strike price and quantity
   - Displays total P&L for all open positions

## Project Structure

```
tradingSetup/
├── app/
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Main trading dashboard
│   └── globals.css         # Global styles
├── components/
│   ├── TradingChart.tsx    # Candlestick chart component
│   ├── TradingPanel.tsx    # Trading controls and info
│   └── TradesList.tsx      # Open positions table
├── utils/
│   ├── supportResistance.ts # S/R detection algorithm
│   └── mockData.ts         # Mock price data generator
├── types/
│   └── trading.ts          # TypeScript type definitions
└── package.json
```

## Technologies Used

- **Next.js 14** - React framework
- **TypeScript** - Type safety
- **TradingView Lightweight Charts** - Professional charting library
- **Tailwind CSS** - Utility-first CSS framework

## Future Enhancements

- Integration with real trading APIs
- Historical trade analysis
- Risk management features
- Multiple timeframes
- Advanced technical indicators
- Paper trading mode

## Disclaimer

This application is for educational and demonstration purposes only. Always do your own research and consult with financial advisors before making trading decisions.

