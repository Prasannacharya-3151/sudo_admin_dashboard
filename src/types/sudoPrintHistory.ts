// ==========================================
// SUDO PRINT HISTORY TYPES
// ==========================================

// ==========================================
// PAYMENT SUMMARY
// ==========================================

export interface PrintHistoryPaymentSummary {
  total_paid: number;
  method: string | null;
  transaction_ids: string[];
}

// ==========================================
// PRINT HISTORY DOCUMENT
// ==========================================

export interface PrintHistoryDocument {
  document_id: string;
  filename: string;
  page_count: number;
  status: string;
  printed_at: string | null;
  document_type: string;
  paper_size: string;
  print_mode: string;
  printing_side: string;
  orientation: string;
  page_layout: number;
  copies: number;
  printable_pages: number;
  sheets_required: number;
  calculated_price: number;
}

// ==========================================
// PRINT SESSION
// ==========================================

export interface PrintHistorySession {
  session_id: string;
  session_type: string;
  kiosk_id: string;
  kiosk_name: string;
  status: string;
  total_amount: number;
  total_sheets: number;
  job_status: string;
  completed_at: string | null;
  created_at: string;

  payment_summary: PrintHistoryPaymentSummary;

  documents: PrintHistoryDocument[];
}

// ==========================================
// PAGINATION
// ==========================================

export interface PrintHistoryPagination {
  page: number;
  page_size: number;
  total: number;
}

// ==========================================
// API RESPONSE DATA
// ==========================================

export interface PrintHistoryData {
  data: PrintHistorySession[];
  page: number;
  page_size: number;
  total: number;
}

// ==========================================
// API RESPONSE
// ==========================================

export interface PrintHistoryResponse {
  data: PrintHistoryData;
}

// ==========================================
// FILTERS
// ==========================================

export interface PrintHistoryFilters {
  kiosk_id?: string;
  institution_id?: string;
  only_printed?: boolean;
  print_mode?: "BW" | "COLOR";
  printing_side?: "SIMPLEX" | "DUPLEX";
  from?: string;
  to?: string;
  page?: number;
  page_size?: number;
}