import { CandlestickData, SupportResistanceLevel } from '@/types/trading';

/**
 * Detects support and resistance levels from candlestick data
 * Uses pivot points and local extrema to identify key levels
 */
export function detectSupportResistance(
  data: CandlestickData[],
  lookbackPeriod: number = 5
): SupportResistanceLevel[] {
  if (data.length < lookbackPeriod * 2) {
    return [];
  }

  const levels: SupportResistanceLevel[] = [];
  const pivotHighs: number[] = [];
  const pivotLows: number[] = [];

  // Find pivot points (local highs and lows)
  for (let i = lookbackPeriod; i < data.length - lookbackPeriod; i++) {
    const currentHigh = data[i].high;
    const currentLow = data[i].low;
    
    // Check if current high is a pivot high
    let isPivotHigh = true;
    for (let j = i - lookbackPeriod; j <= i + lookbackPeriod; j++) {
      if (j !== i && data[j].high >= currentHigh) {
        isPivotHigh = false;
        break;
      }
    }
    
    if (isPivotHigh) {
      pivotHighs.push(currentHigh);
    }

    // Check if current low is a pivot low
    let isPivotLow = true;
    for (let j = i - lookbackPeriod; j <= i + lookbackPeriod; j++) {
      if (j !== i && data[j].low <= currentLow) {
        isPivotLow = false;
        break;
      }
    }
    
    if (isPivotLow) {
      pivotLows.push(currentLow);
    }
  }

  // Group similar price levels together
  const tolerance = 0.01; // 1% tolerance for grouping levels
  const groupedLevels = new Map<number, { price: number; touches: number; type: 'support' | 'resistance' }>();

  // Process resistance levels (pivot highs)
  pivotHighs.forEach(price => {
    let found = false;
    const entries = Array.from(groupedLevels.entries());
    for (let i = 0; i < entries.length; i++) {
      const [key, level] = entries[i];
      if (Math.abs(price - key) / key <= tolerance) {
        level.touches++;
        level.price = (level.price * (level.touches - 1) + price) / level.touches;
        found = true;
        break;
      }
    }
    if (!found) {
      groupedLevels.set(price, { price, touches: 1, type: 'resistance' });
    }
  });

  // Process support levels (pivot lows)
  pivotLows.forEach(price => {
    let found = false;
    const entries = Array.from(groupedLevels.entries());
    for (let i = 0; i < entries.length; i++) {
      const [key, level] = entries[i];
      if (Math.abs(price - key) / key <= tolerance) {
        level.touches++;
        level.price = (level.price * (level.touches - 1) + price) / level.touches;
        found = true;
        break;
      }
    }
    if (!found) {
      groupedLevels.set(price, { price, touches: 1, type: 'support' });
    }
  });

  // Convert to SupportResistanceLevel array and calculate strength
  const levelEntries = Array.from(groupedLevels.values());
  levelEntries.forEach((level) => {
    const strength = Math.min(level.touches / 3, 1); // Normalize strength
    levels.push({
      price: level.price,
      type: level.type,
      strength,
      touches: level.touches,
    });
  });

  // Sort by strength and return top levels
  const sorted = levels
    .sort((a, b) => b.strength - a.strength)
    .slice(0, 10); // Return top 10 levels

  // Fallback: if we failed to find any support levels (can happen on monotonic trends),
  // synthesize one from recent lows so UI never shows "N/A".
  const hasSupport = sorted.some((l) => l.type === 'support');
  if (!hasSupport) {
    const recentWindow = Math.max(20, lookbackPeriod * 4);
    const startIndex = Math.max(0, data.length - recentWindow);
    const recentSlice = data.slice(startIndex);
    if (recentSlice.length > 0) {
      const minLow = Math.min(...recentSlice.map((d) => d.low));
      const touches = recentSlice.filter((d) => Math.abs(d.low - minLow) / minLow < 0.002).length || 1;
      const strength = Math.min(0.3 + touches * 0.1, 0.9); // modest strength; cap below 1
      sorted.push({
        price: minLow,
        type: 'support',
        strength,
        touches,
      });
    }
  }

  return sorted;
}

/**
 * Finds the nearest support or resistance level to current price
 */
export function findNearestLevel(
  price: number,
  levels: SupportResistanceLevel[],
  type?: 'support' | 'resistance'
): SupportResistanceLevel | null {
  const filteredLevels = type 
    ? levels.filter(l => l.type === type)
    : levels;

  if (filteredLevels.length === 0) return null;

  let nearest = filteredLevels[0];
  let minDistance = Math.abs(price - nearest.price);

  for (const level of filteredLevels) {
    const distance = Math.abs(price - level.price);
    if (distance < minDistance) {
      minDistance = distance;
      nearest = level;
    }
  }

  return nearest;
}

/**
 * Checks if price is near a support or resistance level
 */
export function isNearLevel(
  price: number,
  level: SupportResistanceLevel,
  threshold: number = 0.02 // 2% threshold
): boolean {
  return Math.abs(price - level.price) / level.price <= threshold;
}

