// ==========================================
// COMMON API RESPONSE
// ==========================================

export interface ApiResponse<T> {
  data: T;
}

// ==========================================
// KIOSK STATUS
// ==========================================

export type KioskStatus =
  | "active"
  | "inactive"
  | "maintenance"
  | "suspended";

// ==========================================
// KIOSK TYPE
// ==========================================

export type KioskType =
  | "institution"
  | "public";

// ==========================================
// PAIRING STATUS
// ==========================================

export type PairingStatus =
  | "paired"
  | "unpaired"
  | "pending";

// ==========================================
// KIOSK
// ==========================================

export interface Kiosk {
  id: string;

  institution_id?: string | null;

  name: string;

  code: string;

  type: KioskType;

  status: KioskStatus;

  location?: string | null;

  pairing_status?: PairingStatus;

  created_at: string;

  updated_at: string;
}

// ==========================================
// CREATE KIOSK PAYLOAD
// ==========================================

export interface CreateKioskPayload {
  name: string;

  code: string;

  type: KioskType;

  institution_id?: string;

  location?: string;

  status?: KioskStatus;
}

// ==========================================
// UPDATE KIOSK PAYLOAD
// ==========================================

export interface UpdateKioskPayload {
  name?: string;

  code?: string;

  type?: KioskType;

  institution_id?: string | null;

  location?: string;

  status?: KioskStatus;
}

// ==========================================
// KIOSK CAPABILITIES
// ==========================================

export interface KioskCapabilities {
  print?: boolean;

  scan?: boolean;

  copy?: boolean;

  color_print?: boolean;

  black_white_print?: boolean;

  duplex?: boolean;
}

// ==========================================
// UPDATE KIOSK CAPABILITIES
// ==========================================

export interface UpdateKioskCapabilitiesPayload {
  print?: boolean;

  scan?: boolean;

  copy?: boolean;

  color_print?: boolean;

  black_white_print?: boolean;

  duplex?: boolean;
}

// ==========================================
// KIOSK PRICING
// ==========================================

export interface KioskPricing {
  id?: string;

  kiosk_id?: string;

  black_white_single?: number;

  black_white_double?: number;

  color_single?: number;

  color_double?: number;

  scan?: number;

  copy?: number;

  created_at?: string;

  updated_at?: string;
}

// ==========================================
// UPDATE KIOSK PRICING PAYLOAD
// ==========================================

export interface UpdateKioskPricingPayload {
  black_white_single?: number;

  black_white_double?: number;

  color_single?: number;

  color_double?: number;

  scan?: number;

  copy?: number;
}

// ==========================================
// PRINTER
// ==========================================

export interface KioskPrinter {
  id: string;

  kiosk_id?: string;

  name: string;

  model?: string;

  status?: "active" | "inactive";

  is_default?: boolean;

  created_at?: string;

  updated_at?: string;
}

// ==========================================
// ADD PRINTER PAYLOAD
// ==========================================

export interface AddKioskPrinterPayload {
  name: string;

  model?: string;

  is_default?: boolean;
}

// ==========================================
// UPDATE PRINTER PAYLOAD
// ==========================================

export interface UpdateKioskPrinterPayload {
  name?: string;

  model?: string;

  status?: "active" | "inactive";

  is_default?: boolean;
}

// ==========================================
// KIOSK PAIRING
// ==========================================

export interface KioskPairing {
  kiosk_id: string;

  pairing_code?: string;

  device_id?: string;

  status: PairingStatus;

  paired_at?: string | null;
}

// ==========================================
// PAIR KIOSK PAYLOAD
// ==========================================

export interface PairKioskPayload {
  device_id?: string;

  pairing_code?: string;
}

// ==========================================
// KIOSK DETAILS
// ==========================================

export interface KioskDetails extends Kiosk {
  capabilities?: KioskCapabilities;

  pricing?: KioskPricing;

  printers?: KioskPrinter[];

  pairing?: KioskPairing;
}

// ==========================================
// KIOSK LIST RESPONSE
// ==========================================

export interface KioskListResponse {
  items: Kiosk[];

  total?: number;

  page?: number;

  limit?: number;
}