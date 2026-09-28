export interface ApiResponse<T> {
  data?: T;
  message?: string;
  error?: string;
  detail?: string;
}

export type MachineStatus =
  | "active"
  | "inactive"
  | "maintenance"
  | "blocked";

export interface RechargeMachine {
  id: string;
  institution_id: string;
  institution_name: string;
  recharge_machine_block: string;
  ble_id: string;
  initial_balance?: number;
  recharge_balance?: string | number;
  balance?: string | number;
  status?: MachineStatus | string;
  created_at?: string;
  updated_at?: string;
}

export interface CreateMachinePayload {
  institution_id: string;
  institution_name: string;
  recharge_machine_block: string;
  ble_id: string;
  initial_balance: number;
}

export interface MachineBalance {
  machine_id: string;
  balance: string | number;
  updated_at?: string;
}

export interface RechargeMachinePayload {
  amount: number;
}

/* =========================
   RFID CARD
========================= */

export type RFIDCardStatus =
  | "active"
  | "inactive"
  | "blocked";

export interface RFIDCard {
  id?: string;

  card_uuid: string;

  balance?: string | number;
  status?: RFIDCardStatus | string;

  std_id?: string;
  std_name?: string;
  std_reg?: string;
  combination?: string;

  machine_id?: string;

  created_at?: string;
  updated_at?: string;

  /* Detail API fields */
  wallet_bal?: string | number;
  wallet_status?: RFIDCardStatus | string;
}

export interface RFIDCardDetails extends RFIDCard {
  card_uuid: string;

  wallet_bal: string | number;
  wallet_status: RFIDCardStatus | string;

  std_id?: string;
  std_reg?: string;
  std_name?: string;
  group?: string;

  transactions?: RFIDTransaction[];
}

export interface UpdateCardStatusPayload {
  status: RFIDCardStatus;
}

/* =========================
   RFID TRANSACTIONS
========================= */

export type RFIDTransactionType =
  | "spend"
  | "recharge"
  | "debit"
  | "credit"
  | "payment"
  | string;

export interface RFIDTransaction {
  session_id: string;

  txn_type: RFIDTransactionType;

  amount: string | number;

  wallet_bal_after: string | number;

  location: string | null;

  created_at: string;

  /* Optional compatibility fields */
  id?: string;
  card_uuid?: string;
  machine_id?: string;
  ble_id?: string;
  description?: string;
}

/* =========================
   API RESPONSE TYPES
========================= */

export type MachineResponse =
  ApiResponse<RechargeMachine>;

export type MachinesResponse =
  ApiResponse<RechargeMachine[]>;

export type MachineBalanceResponse =
  ApiResponse<MachineBalance>;

export type RFIDCardsResponse =
  ApiResponse<RFIDCard[]>;

export type RFIDCardResponse =
  ApiResponse<RFIDCardDetails>;

export type RFIDHistoryResponse =
  ApiResponse<RFIDTransaction[]>;