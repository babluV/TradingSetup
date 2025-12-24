# Nifty 50 Options Trading Setup

A specialized web application for **Nifty 50 options trading** with automated support and resistance detection. Designed specifically for the Indian stock market (NSE).

## 🎯 Nifty 50 Specific Features

### Trading Strategy
- **Buy Call Options** when Nifty 50 is near **Support** levels (expecting bounce up)
- **Buy Put Options** when Nifty 50 is near **Resistance** levels (expecting bounce down)

### Nifty 50 Specifications
- **Index Range**: 20,000 - 25,000 (typical trading range)
- **Lot Size**: 50 shares per lot
- **Exchange**: NSE (National Stock Exchange of India)
- **Currency**: Indian Rupees (₹)
- **Volatility**: 0.3-0.8% per candle (realistic for Nifty 50)

## 🚀 Quick Start

### Installation

```bash
npm install
```

### Run Development Server

```bash
npm run dev
```

Open **http://localhost:3000** in your browser.

## 📊 Application Features

### 1. Nifty 50 Index Chart
- **Real-time candlestick chart** showing Nifty 50 price movements
- **Blue lines** = Support levels
- **Orange lines** = Resistance levels
- **Green candles** = Price increase
- **Red candles** = Price decrease
- Price range: 19,500 - 25,500

### 2. Trading Panel
- **Current Nifty 50 Index** display
- **Support/Resistance Detection**:
  - Shows nearest support and resistance levels
  - Displays strength percentage
  - Shows distance from current price
  - Highlights when near levels (within 2%)
  
- **Trading Controls**:
  - Strike Price input (Nifty 50 levels)
  - Lot Size (Quantity) input
  - Buy Call button (enabled at support)
  - Buy Put button (enabled at resistance)

- **P&L Summary**:
  - Total Profit/Loss in ₹
  - Number of open positions

### 3. Position Management
- **Open Positions Table** showing:
  - Option type (CALL/PUT)
  - Strike price
  - Entry price
  - Current Nifty 50 price
  - Lot size (quantity)
  - Real-time P&L in ₹
  - Close position button

## 💡 How It Works

### Support/Resistance Detection
The application uses a pivot point algorithm specifically tuned for Nifty 50:
- Analyzes local highs (resistance) and lows (support)
- Groups similar price levels together
- Calculates strength based on number of touches
- Displays levels on chart with different line styles

### P&L Calculation
- **Nifty 50 Lot Size**: 50 shares per lot
- **Call Options**: Profit = (Current Price - Strike Price) × Lot Size × Quantity
- **Put Options**: Profit = (Strike Price - Current Price) × Lot Size × Quantity

### Trading Rules
1. **At Support**: Buy Call Options
   - Price must be within 2% of support level
   - Button enables automatically
   - Strategy: Expect bounce up from support

2. **At Resistance**: Buy Put Options
   - Price must be within 2% of resistance level
   - Button enables automatically
   - Strategy: Expect bounce down from resistance

## 📈 Example Trading Scenarios

### Scenario 1: Nifty 50 Near Support
```
Current Nifty 50: 21,850
Nearest Support: 21,800 (0.23% away)

Action: Buy Call Options
- Strike: 21,850
- Lot Size: 1
- Expected: Bounce up from support
```

### Scenario 2: Nifty 50 Near Resistance
```
Current Nifty 50: 22,450
Nearest Resistance: 22,500 (0.22% away)

Action: Buy Put Options
- Strike: 22,450
- Lot Size: 1
- Expected: Bounce down from resistance
```

## 🎨 Visual Indicators

| Element | Color | Meaning |
|---------|-------|---------|
| Up Candles | 🟢 Green | Nifty 50 increased |
| Down Candles | 🔴 Red | Nifty 50 decreased |
| Support Lines | 🔵 Blue | Support levels |
| Resistance Lines | 🟠 Orange | Resistance levels |
| Buy Call Button | 🟢 Green | Enabled at support |
| Buy Put Button | 🔴 Red | Enabled at resistance |
| Profit | 🟢 Green | Positive P&L |
| Loss | 🔴 Red | Negative P&L |

## 🔧 Technical Details

### Data Generation
- **Base Price**: 22,000 ± 1,000 (realistic Nifty 50 range)
- **Volatility**: 0.3-0.8% per candle
- **Price Range**: 19,500 - 25,500 (capped)
- **Volume**: 1-5 crores (realistic for Nifty 50)

### Technologies
- **Framework**: Next.js 14 with TypeScript
- **Charting**: TradingView Lightweight Charts
- **Styling**: Tailwind CSS
- **State Management**: React Hooks

## 📝 Nifty 50 Market Context

### About Nifty 50
- **Full Name**: Nifty 50 Index
- **Exchange**: National Stock Exchange (NSE), India
- **Composition**: 50 largest and most liquid stocks
- **Base Year**: 1995 (Base Value: 1000)
- **Typical Range**: 20,000 - 25,000 (as of 2024)
- **Trading Hours**: 9:15 AM - 3:30 PM IST

### Options Trading
- **Lot Size**: 50 shares
- **Strike Intervals**: Usually 50 or 100 points
- **Expiry**: Weekly, Monthly
- **Settlement**: Cash settled

## ⚠️ Important Notes

- This is a **demo application** with simulated data
- For real trading, integrate with NSE APIs or brokers
- Always do your own research before trading
- Options trading involves significant risk
- Past performance does not guarantee future results
- Consult with a financial advisor before trading

## 🎯 Next Steps

1. **Open http://localhost:3000**
2. **Observe** the Nifty 50 chart
3. **Wait** for price to approach support/resistance
4. **Execute** trades when buttons are enabled
5. **Monitor** positions and P&L

## 📚 Additional Resources

- [NSE India Official Website](https://www.nseindia.com/)
- [Nifty 50 Index Information](https://www.nseindia.com/market-data/indices)
- [Options Trading Basics](https://www.nseindia.com/learn/derivatives)

---

**Happy Trading! 📈**

*Remember: Trade responsibly and manage your risk.*










