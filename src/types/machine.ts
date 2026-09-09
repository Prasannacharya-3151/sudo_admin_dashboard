// ==========================================
// COMMON API RESPONSE
// ==========================================

export interface ApiResponse<T> {
  data?: T;
  message?: string;
  error?: string;
  detail?: string;
}

// ==========================================
// MACHINE STATUS
// ==========================================

export type MachineStatus =
  | "active"
  | "inactive"
  | "maintenance"
  | "blocked";

// ==========================================
// RECHARGE MACHINE
// ==========================================

export interface RechargeMachine {
  id: string;

  institution_id: string;

  institution_name: string;

  recharge_machine_block: string;

  ble_id: string;

  initial_balance?: number;

  // This is what the API actually returns for
  // the machine's current balance. It comes back
  // as a STRING (e.g. "1000.00"), not a number.
  recharge_balance?: string | number;

  balance?: number;

  status?: MachineStatus | string;

  created_at?: string;

  updated_at?: string;
}
// ==========================================
// CREATE RECHARGE MACHINE PAYLOAD
//
// POST /machines
//
// Backend expects:
//
// {
//   "institution_id": "<uuid>",
//   "institution_name": "ABC College",
//   "recharge_machine_block": "Block A",
//   "ble_id": "08CB64AE114C",
//   "initial_balance": 5000
// }
// ==========================================

export interface CreateMachinePayload {
  institution_id: string;

  institution_name: string;

  recharge_machine_block: string;

  ble_id: string;

  initial_balance: number;
}

// ==========================================
// MACHINE BALANCE
//
// GET /machines/:id/balance
// ==========================================

export interface MachineBalance {
  machine_id: string;

  balance: number;

  updated_at?: string;
}

// ==========================================
// RECHARGE MACHINE PAYLOAD
//
// POST /machines/:id/recharge
//
// {
//   "amount": 2000
// }
// ==========================================

export interface RechargeMachinePayload {
  amount: number;
}

// ==========================================
// RFID CARD STATUS
// ==========================================

export type RFIDCardStatus =
  | "active"
  | "inactive"
  | "blocked";

// ==========================================
// RFID CARD
// ==========================================

export interface RFIDCard {
  id?: string;

  card_uuid: string;

  machine_id?: string;

  balance?: number;

  status?: RFIDCardStatus;

  created_at?: string;

  updated_at?: string;
}

// ==========================================
// RFID CARD DETAILS
// ==========================================

export interface RFIDCardDetails extends RFIDCard {
  transactions?: RFIDTransaction[];
}

// ==========================================
// UPDATE RFID CARD STATUS
// ==========================================

export interface UpdateCardStatusPayload {
  status: RFIDCardStatus;
}

// ==========================================
// RFID TRANSACTION TYPE
// ==========================================

export type RFIDTransactionType =
  | "recharge"
  | "debit"
  | "credit"
  | "payment";

// ==========================================
// RFID TRANSACTION
// ==========================================

export interface RFIDTransaction {
  id?: string;

  session_id?: string;

  card_uuid?: string;

  machine_id?: string;

  ble_id?: string;

  amount: number;

  transaction_type?: RFIDTransactionType;

  description?: string;

  created_at?: string;
}

// ==========================================
// MACHINE API RESPONSES
// ==========================================

export type MachineResponse =
  ApiResponse<RechargeMachine>;

export type MachinesResponse =
  ApiResponse<RechargeMachine[]>;

export type MachineBalanceResponse =
  ApiResponse<MachineBalance>;

// ==========================================
// RFID API RESPONSES
// ==========================================

export type RFIDCardsResponse =
  ApiResponse<RFIDCard[]>;

export type RFIDCardResponse =
  ApiResponse<RFIDCardDetails>;

export type RFIDHistoryResponse =
  ApiResponse<RFIDTransaction[]>;