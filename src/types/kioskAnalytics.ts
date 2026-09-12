// ==========================================
// SUDO ANALYTICS TYPES
// ==========================================

// ==========================================
// COMMON
// ==========================================

export interface ApiResponse<T> {
  data: T;
}

// ==========================================
// REVENUE
// ==========================================

export interface RevenueSummary {
  total_revenue: number;
  total_sheets: number;
  sessions: number;
}

export interface KioskRevenue {
  kiosk_id: string;
  kiosk_name: string;
  kiosk_type: "public" | "institution";
  institution_id?: string | null;
  total_revenue: number;
  total_sheets: number;
  sessions: number;
}

// ==========================================
// PRINT MODE
// ==========================================

export type PrintMode = "BW" | "COLOR";

export interface PrintModeRevenue {
  print_mode: PrintMode;
  total_revenue: number;
  total_sheets: number;
  printed_pages: number;
}

// ==========================================
// PAYMENT METHOD
// ==========================================

export type PaymentMethod = "upi" | "rfid";

export interface PaymentMethodRevenue {
  method: PaymentMethod;
  total_revenue: number;
  payments: number;
}

// ==========================================
// PAGES
// ==========================================

export interface KioskPageAnalytics {
  print_mode: PrintMode;
  total_sheets: number;
  printed_pages: number;
}

// ==========================================
// STUCK JOBS
// ==========================================

export interface StuckJob {
  job_id: string;
  session_id: string;
  kiosk_id: string;
  kiosk_name: string;
  status: string;
  error_message?: string | null;
  queued_at?: string | null;
  started_at?: string | null;
  stuck_for_minutes: number;
}

// ==========================================
// DOCUMENT
// ==========================================

export interface AnalyticsDocument {
  document_id: string;
  filename: string;
  page_count: number;
  status: string;
  printed_at?: string | null;

  document_type?: string | null;
  paper_size?: string | null;

  print_mode?: string | null;

  printing_side?: string | null;

  orientation?: string | null;

  page_layout?: number | null;

  copies?: number | null;

  printable_pages?: number | null;

  sheets_required?: number | null;

  calculated_price?: number | null;
}

// ==========================================
// UNPRINTED DOCUMENT
// ==========================================

export interface UnprintedDocument
  extends AnalyticsDocument {
  session_id: string;
}