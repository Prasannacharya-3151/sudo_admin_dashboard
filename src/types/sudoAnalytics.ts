// ==========================================
// SUDO ANALYTICS TYPES
// ==========================================

// ==========================================
// REVENUE OVERVIEW
// ==========================================

export interface SudoRevenueResponse {
  total_revenue: number;
  total_sheets: number;
  sessions: number;
}

// ==========================================
// REVENUE BY KIOSK
// ==========================================

export interface KioskRevenue {
  kiosk_id: string;
  kiosk_name: string;
  kiosk_type: string;
  institution_id?: string | null;

  total_revenue: number;
  total_sheets: number;
  sessions: number;
}

// Backend returns:
// {
//   data: [
//     {...},
//     {...}
//   ]
// }

export type SudoRevenueByKioskResponse =
  KioskRevenue[];

// ==========================================
// GROWTH PERIOD
// ==========================================

export interface GrowthPeriod {
  total_revenue: number;
  total_sheets: number;
  sessions: number;
}

// ==========================================
// DAILY GROWTH SERIES
// ==========================================

export interface GrowthDailySeries {
  period_start: string;
  revenue: number;
  sheets: number;
  sessions: number;
}

// ==========================================
// GROWTH RESPONSE
// ==========================================

export interface SudoGrowthResponse {
  current: GrowthPeriod;
  previous: GrowthPeriod;
  growth_pct: number | null;
  daily_series: GrowthDailySeries[];
}