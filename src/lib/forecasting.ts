/**
 * Usage forecasting via simple linear regression on daily spend history.
 *
 * We use ordinary least-squares (OLS) on time-indexed data so that a rising or
 * falling trend is captured rather than a simple daily average.  The model is
 * intentionally lightweight (zero deps, runs in the browser/edge).
 */

export interface DailyPoint {
  date: string; // YYYY-MM-DD
  total: number; // cost in USD
}

export interface ForecastResult {
  /** Projected spend for the current calendar month (USD) */
  projectedMonthTotal: number;
  /** Projected spend remaining in the current month from today (USD) */
  projectedMonthRemaining: number;
  /** Projected daily spend rate (USD/day) based on trend */
  dailyRate: number;
  /** Days used in the regression (non-zero data points) */
  dataPoints: number;
  /** Trend direction derived from OLS slope */
  trend: 'rising' | 'falling' | 'stable';
  /** OLS slope (USD per day) */
  slope: number;
  /** Projected spend for the next 30 days from today (USD) */
  next30Days: number;
  /** Confidence: 'high' ≥14 data points, 'medium' ≥7, 'low' otherwise */
  confidence: 'high' | 'medium' | 'low';
}

/**
 * Run ordinary least-squares linear regression on (x, y) pairs.
 * Returns { slope, intercept } where y_hat = slope * x + intercept.
 */
function olsRegression(points: { x: number; y: number }[]): { slope: number; intercept: number } {
  const n = points.length;
  if (n === 0) return { slope: 0, intercept: 0 };
  if (n === 1) return { slope: 0, intercept: points[0].y };

  let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
  for (const { x, y } of points) {
    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumXX += x * x;
  }
  const denom = n * sumXX - sumX * sumX;
  if (denom === 0) return { slope: 0, intercept: sumY / n };

  const slope = (n * sumXY - sumX * sumY) / denom;
  const intercept = (sumY - slope * sumX) / n;
  return { slope, intercept };
}

/**
 * Forecast future spend from historical daily data.
 *
 * @param history   Array of daily spend points (oldest → newest), any length.
 *                  Zero-spend days are excluded from the regression so sparse
 *                  data does not pull the model toward zero.
 * @param today     Optional override for "today" (defaults to new Date()). Must
 *                  be a Date at midnight local time.
 */
export function forecastSpend(history: DailyPoint[], today = new Date()): ForecastResult {
  // Filter to non-zero days only — zeros usually mean no API calls, not $0 cost
  const active = history.filter((d) => d.total > 0);

  const noData: ForecastResult = {
    projectedMonthTotal: 0,
    projectedMonthRemaining: 0,
    dailyRate: 0,
    dataPoints: 0,
    trend: 'stable',
    slope: 0,
    next30Days: 0,
    confidence: 'low',
  };

  if (active.length === 0) return noData;

  // Build OLS input: x = day index (0-based, ascending), y = cost
  const sorted = [...active].sort((a, b) => a.date.localeCompare(b.date));
  const olsPoints = sorted.map((d, i) => ({ x: i, y: d.total }));
  const { slope, intercept } = olsRegression(olsPoints);

  // Project forward: x for "today relative to the last data point"
  const lastDataDate = new Date(sorted[sorted.length - 1].date + 'T00:00:00');
  const todayMidnight = new Date(today.toISOString().slice(0, 10) + 'T00:00:00');
  const daysFromLastToToday = Math.max(
    0,
    Math.round((todayMidnight.getTime() - lastDataDate.getTime()) / 86_400_000)
  );

  // x value for "today" in the regression coordinate system
  const xToday = olsPoints.length - 1 + daysFromLastToToday;
  const dailyRateAtToday = Math.max(0, slope * xToday + intercept);

  // Calendar math for the current month
  const year = todayMidnight.getFullYear();
  const month = todayMidnight.getMonth();
  const dayOfMonth = todayMidnight.getDate(); // 1-based
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysRemaining = daysInMonth - dayOfMonth + 1; // include today

  // Project each remaining day with the regression line
  let projectedRemaining = 0;
  for (let i = 0; i < daysRemaining; i++) {
    projectedRemaining += Math.max(0, slope * (xToday + i) + intercept);
  }

  // Spend already recorded this calendar month (first day of month → yesterday)
  const monthStart = `${year}-${String(month + 1).padStart(2, '0')}-01`;
  const todayStr = todayMidnight.toISOString().slice(0, 10);
  const spentThisMonth = history
    .filter((d) => d.date >= monthStart && d.date < todayStr)
    .reduce((s, d) => s + d.total, 0);

  const projectedMonthTotal = spentThisMonth + projectedRemaining;

  // Next-30-days projection
  let next30Days = 0;
  for (let i = 0; i < 30; i++) {
    next30Days += Math.max(0, slope * (xToday + i) + intercept);
  }

  // Trend: slope of more than $0.01/day is meaningful
  const SLOPE_THRESHOLD = 0.01;
  const trend: ForecastResult['trend'] =
    slope > SLOPE_THRESHOLD ? 'rising' : slope < -SLOPE_THRESHOLD ? 'falling' : 'stable';

  const confidence: ForecastResult['confidence'] =
    active.length >= 14 ? 'high' : active.length >= 7 ? 'medium' : 'low';

  return {
    projectedMonthTotal: Math.round(projectedMonthTotal * 10000) / 10000,
    projectedMonthRemaining: Math.round(projectedRemaining * 10000) / 10000,
    dailyRate: Math.round(dailyRateAtToday * 10000) / 10000,
    dataPoints: active.length,
    trend,
    slope: Math.round(slope * 100000) / 100000,
    next30Days: Math.round(next30Days * 10000) / 10000,
    confidence,
  };
}
