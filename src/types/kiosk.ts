// ==========================================
// COMMON API RESPONSE
// ==========================================

export interface ApiResponse<T> {
  data: T;
}

// ==========================================
// ENUMS
// ==========================================

export type KioskType = "institution" | "public";

export type PaperSize = "A4" | "A3" | "LETTER";

export type PrintMode = "BW" | "COLOR";

export type PrintingSide = "SIMPLEX" | "DUPLEX";

// ==========================================
// KIOSK (base object — register response / list rows)
// ==========================================

export interface Kiosk {
  id: string;
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

// ==========================================
// CREATE KIOSK — POST /sudo-admin/kiosks/
// ==========================================

export interface CreateKioskPayload {
  name: string; // required, <=100 chars
  kiosk_type: KioskType;
  // required + must exist if kiosk_type === "institution"
  // must be null if kiosk_type === "public"
  institution_id?: string | null;
  address_line_1: string; // required
  address_line_2?: string | null;
  city: string; // required, <=100 chars
  state: string; // required, <=100 chars
  country: string; // required, <=100 chars
  postal_code?: string | null; // <=20 chars
  latitude?: number | null;
  longitude?: number | null;
  // pairing_code is server-generated — never send it
}

// ⏳ PATCH /sudo-admin/kiosks/{kioskId} — route not built on backend yet
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

// ==========================================
// KIOSK CAPABILITIES
// ==========================================

export interface KioskCapabilities {
  color_printing: boolean;
  duplex_printing: boolean;
  upi_payment: boolean;
  rfid_payment: boolean;
}

// PUT /sudo-admin/kiosks/{kioskId}/capabilities
// only keys present in the payload are touched; omitted keys keep current value
export type UpdateKioskCapabilitiesPayload = Partial<KioskCapabilities>;

// ==========================================
// PRICING (row-based — one row per paper_size + print_mode + printing_side)
// ==========================================

export interface KioskPricing {
  id: string;
  paper_size: PaperSize;
  print_mode: PrintMode;
  printing_side: PrintingSide;
  price_per_sheet: number;
  active: boolean;
}

// POST /sudo-admin/kiosks/{kioskId}/pricing
export interface CreateKioskPricingPayload {
  paper_size: PaperSize;
  print_mode: PrintMode;
  printing_side: PrintingSide;
  price_per_sheet: number; // must be > 0
}

// PATCH /sudo-admin/kiosks/{kioskId}/pricing/{pricingId}
export interface UpdateKioskPricingPayload {
  price_per_sheet?: number; // must be > 0
  active?: boolean;
}

// ==========================================
// PRINTERS
// ==========================================

export interface KioskPrinter {
  id: string;
  manufacturer: string;
  model: string;
  serial_number: string;
  is_default: boolean; // server-decided — never sent by client
  installed_at: string;
  removed_at: string | null;
}

// POST /sudo-admin/kiosks/{kioskId}/printers
export interface AddKioskPrinterPayload {
  manufacturer: string;
  model: string;
  serial_number: string;
}

// NOTE: spec has no update-printer endpoint — only create (§3.6), list, and delete.

// ==========================================
// KIOSK DETAILS — GET /sudo-admin/kiosks/{kioskId}  (§3.2)
// ==========================================

export interface KioskDetails {
  id: string;
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
  pairing_code?: string;   // ADDED — confirm with backend
  device_id?: string | null;  // ADDED
  paired_at?: string | null;  // ADDED
  capabilities: KioskCapabilities;
  pricing: KioskPricing[];
  printers: KioskPrinter[];
}

// ==========================================
// PAIRING — machine-facing flow (§4)
// ==========================================


// ==========================================
// ⏳ PLACEHOLDER — admin-facing pairing endpoints not yet in the confirmed
// spec. Swap these shapes/paths once backend confirms the real contract.
// ==========================================

export interface KioskPairingStatusResponse {
  kiosk_id: string;
  pairing_code?: string;
  device_id?: string | null;
  paired_at?: string | null;
}

export interface AdminPairKioskPayload {
  pairing_code?: string;
  device_id?: string;
}

// POST /kiosks/pair — NO auth, called by the kiosk desktop app itself
export interface PairKioskPayload {
  pairing_code: string;
}

export interface PairKioskResponse {
  device_id: string;
  device_secret: string; // returned exactly once, never retrievable again
  paired_at: string;
}

// POST /kiosks/auth — NO auth, called at every kiosk boot
export interface KioskAuthPayload {
  device_id: string;
  device_secret: string;
}

export interface KioskAuthResponse {
  kiosk_access_token: string;
  expires_in: number; // seconds (1800 = 30 min)
}

// POST /sudo-admin/kiosks/{kioskId}/unpair
export interface UnpairKioskResponse {
  id: string;
  pairing_code: string; // fresh code — show this to the admin to re-pair
  unpaired_at: string;
}

// There is no dedicated "get pairing status" endpoint — read paired_at /
// device_id straight off the Kiosk / KioskDetails object instead.

// ==========================================
// LIST FILTERS — for GET /sudo-admin/kiosks (⏳ not built)
// while pending, KiosksPage falls back to public GET /kiosk/ and
// applies these filters client-side
// ==========================================

export interface KioskListFilters {
  kiosk_type?: KioskType;
  institution_id?: string;
  paired?: boolean;
}