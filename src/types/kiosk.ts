// ============================================================
// COMMON API RESPONSE
// ============================================================

export interface ApiResponse<T> {
  data: T;
}

// ============================================================
// ENUMS / UNION TYPES
// ============================================================

export type KioskType = "institution" | "public";

export type PaperSize = "A4" | "A3" | "LETTER";

export type PrintMode = "BW" | "COLOR";

export type PrintingSide = "SIMPLEX" | "DUPLEX";

/**
 * Number of document pages printed on one physical sheet.
 *
 * 1 = one page per sheet
 * 2 = two pages per sheet
 * 4 = four pages per sheet
 */
export type PagesPerSheet = 1 | 2 | 4;

// ============================================================
// KIOSK
// ============================================================

export interface Kiosk {
  id: string;

  /** Permanent, immutable, human-readable code (e.g. PP-7K3M9Q). */
  kiosk_code: string;

  institution_id: string | null;

  name: string;

  kiosk_type: KioskType;

  address_line_1: string;

  address_line_2?: string | null;

  city: string;

  state: string;

  country: string;

  postal_code?: string | null;

  latitude?: number | null;

  longitude?: number | null;

  pairing_code: string;

  device_id: string | null;

  paired_at: string | null;

  created_at: string;

  updated_at: string;
}

// ============================================================
// CREATE KIOSK PAYLOAD
// ============================================================

export interface CreateKioskPayload {
  name: string;

  kiosk_type: KioskType;

  institution_id?: string | null;

  address_line_1: string;

  address_line_2?: string | null;

  city: string;

  state: string;

  country: string;

  postal_code?: string | null;

  latitude?: number | null;

  longitude?: number | null;
}

// ============================================================
// UPDATE KIOSK PAYLOAD
// ============================================================

export interface UpdateKioskPayload {
  name?: string;

  kiosk_type?: KioskType;

  institution_id?: string | null;

  address_line_1?: string;

  address_line_2?: string | null;

  city?: string;

  state?: string;

  country?: string;

  postal_code?: string | null;

  latitude?: number | null;

  longitude?: number | null;
}

// ============================================================
// KIOSK CAPABILITIES
// ============================================================

/**
 * All supported kiosk capabilities.
 *
 * The public GET endpoint should return all seven keys.
 * Unsupported or missing capabilities should be false.
 */
export interface KioskCapabilities {
  color_printing: boolean;

  duplex_printing: boolean;

  upi_payment: boolean;

  rfid_payment: boolean;

  pages_per_sheet_1: boolean;

  pages_per_sheet_2: boolean;

  pages_per_sheet_4: boolean;
}

/**
 * PUT /api/v1/sudo-admin/kiosks/{kioskId}/capabilities
 *
 * Partial updates are supported.
 * Only supplied keys should be updated by the backend.
 */
export type UpdateKioskCapabilitiesPayload =
  Partial<KioskCapabilities>;

// ============================================================
// KIOSK COMBINATION PRICING
// ============================================================

/**
 * A saved pricing combination.
 *
 * A unique combination consists of:
 * paper_size + print_mode + printing_side
 *
 * The print-time page_layout (1-up / 2-up / 4-up) does not
 * affect pricing; the same per-sheet price applies to every
 * supported layout.
 */
export interface KioskPricing {
  id: string;

  paper_size: PaperSize;

  print_mode: PrintMode;

  printing_side: PrintingSide;

  price_per_sheet: number;

  active: boolean;
}

// ============================================================
// CREATE KIOSK PRICING PAYLOAD
// ============================================================

/**
 * POST /api/v1/sudo-admin/kiosks/{kioskId}/pricing
 *
 * Pricing is uniquely identified by paper size, print mode,
 * and printing side. Do not send pages_per_sheet.
 */
export interface CreateKioskPricingPayload {
  paper_size: PaperSize;

  print_mode: PrintMode;

  printing_side: PrintingSide;

  price_per_sheet: number;
}

// ============================================================
// UPDATE KIOSK PRICING PAYLOAD
// ============================================================

/**
 * PATCH /api/v1/sudo-admin/kiosks/{kioskId}/pricing/{pricingId}
 *
 * Only the price and active status can be changed.
 */
export interface UpdateKioskPricingPayload {
  price_per_sheet?: number;

  active?: boolean;
}

// ============================================================
// SIMPLE PAPER PRICING
// ============================================================

/**
 * Existing simple paper pricing.
 *
 * Kept separate from combination pricing so the existing
 * blank-sheet/A4 pricing functionality can continue to work.
 */
export interface PaperPricing {
  id: string;

  paper_size: string;

  price_per_sheet: number;

  active: boolean;
}

// ============================================================
// CREATE SIMPLE PAPER PRICING PAYLOAD
// ============================================================

export interface CreatePaperPricingPayload {
  paper_size: PaperSize;

  price_per_sheet: number;
}

// ============================================================
// UPDATE SIMPLE PAPER PRICING PAYLOAD
// ============================================================

export interface UpdatePaperPricingPayload {
  price_per_sheet?: number;

  active?: boolean;
}

// ============================================================
// KIOSK DETAILS
// ============================================================

export interface KioskDetails {
  id: string;

  /** Permanent, immutable, human-readable code (e.g. PP-7K3M9Q). */
  kiosk_code: string;

  name: string;

  kiosk_type: KioskType;

  institution_id: string | null;

  address_line_1: string;

  address_line_2?: string | null;

  city: string;

  state: string;

  country: string;

  postal_code?: string | null;

  latitude?: number | null;

  longitude?: number | null;

  status: string;

  pairing_code?: string;

  device_id?: string | null;

  paired_at?: string | null;

  capabilities: KioskCapabilities;

  pricing: KioskPricing[];

  printers: KioskPrinter[];
}

// ============================================================
// KIOSK PRINTERS
// ============================================================

export interface KioskPrinter {
  id: string;

  manufacturer: string;

  model: string;

  serial_number: string;

  is_default: boolean;

  installed_at: string;

  removed_at: string | null;
}

// ============================================================
// ADD KIOSK PRINTER PAYLOAD
// ============================================================

export interface AddKioskPrinterPayload {
  manufacturer: string;

  model: string;

  serial_number: string;
}

// ============================================================
// KIOSK PAIRING STATUS
// ============================================================

export interface KioskPairingStatusResponse {
  kiosk_id: string;

  pairing_code?: string;

  device_id?: string | null;

  paired_at?: string | null;
}

// ============================================================
// ADMIN PAIR KIOSK PAYLOAD
// ============================================================

export interface AdminPairKioskPayload {
  pairing_code?: string;

  device_id?: string;
}

// ============================================================
// PAIR KIOSK PAYLOAD
// ============================================================

export interface PairKioskPayload {
  pairing_code: string;
}

// ============================================================
// PAIR KIOSK RESPONSE
// ============================================================

export interface PairKioskResponse {
  device_id: string;

  device_secret: string;

  paired_at: string;
}

// ============================================================
// KIOSK DEVICE AUTHENTICATION PAYLOAD
// ============================================================

export interface KioskAuthPayload {
  device_id: string;

  device_secret: string;
}

// ============================================================
// KIOSK DEVICE AUTHENTICATION RESPONSE
// ============================================================

export interface KioskAuthResponse {
  kiosk_access_token: string;

  expires_in: number;
}

// ============================================================
// UNPAIR KIOSK RESPONSE
// ============================================================

export interface UnpairKioskResponse {
  id: string;

  pairing_code: string;

  unpaired_at: string;
}

// ============================================================
// KIOSK LIST FILTERS
// ============================================================

export interface KioskListFilters {
  kiosk_type?: KioskType;

  institution_id?: string;

  paired?: boolean;
}