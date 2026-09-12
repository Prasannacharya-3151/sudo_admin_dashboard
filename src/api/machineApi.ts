import { RFID_API_BASE_URL } from "./apiConfig";

import type {
  ApiResponse,
  CreateMachinePayload,
  MachineBalance,
  RechargeMachine,
  RechargeMachinePayload,
  RFIDCard,
  RFIDCardDetails,
  RFIDTransaction,
  UpdateCardStatusPayload,
} from "../types/machine";

// ==========================================
// ERROR HELPER
// ==========================================

const getErrorMessage = async (
  response: Response,
): Promise<string> => {
  try {
    const errorData = await response.json();

    console.error(
      "API Error Response:",
      errorData,
    );

    // FastAPI validation errors
    if (Array.isArray(errorData?.detail)) {
      return errorData.detail
        .map((item: any) => {
          const field = item?.loc
            ? item.loc
                .filter(
                  (location: string) =>
                    location !== "body",
                )
                .join(".")
            : "";

          return field
            ? `${field}: ${item?.msg || "Invalid value"}`
            : item?.msg || "Validation error";
        })
        .join(", ");
    }

    // Normal string detail
    if (
      typeof errorData?.detail === "string"
    ) {
      return errorData.detail;
    }

    if (
      typeof errorData?.message === "string"
    ) {
      return errorData.message;
    }

    if (
      typeof errorData?.error === "string"
    ) {
      return errorData.error;
    }

    return `Request failed with status ${response.status}`;
  } catch {
    return `Request failed with status ${response.status}`;
  }
};

// ==========================================
// RESPONSE HELPER
//
// Supports:
//
// { data: ... }
//
// OR direct response
// ==========================================

const unwrapResponse = <T>(
  result: ApiResponse<T> | T,
): T => {
  if (
    typeof result === "object" &&
    result !== null &&
    "data" in result &&
    result.data !== undefined
  ) {
    return result.data;
  }

  return result as T;
};

// ==========================================
// GET ALL MACHINES
//
// GET /machines
// ==========================================

export const getMachines = async (): Promise<
  RechargeMachine[]
> => {
  const response = await fetch(
    `${RFID_API_BASE_URL}/machines`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    },
  );

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(response),
    );
  }

  const result:
    | ApiResponse<RechargeMachine[]>
    | RechargeMachine[] =
    await response.json();

  return unwrapResponse<RechargeMachine[]>(
    result,
  );
};

export const createMachine = async (
  payload: CreateMachinePayload,
): Promise<RechargeMachine> => {
  console.log(
    "CREATE MACHINE PAYLOAD:",
    payload,
  );

  const response = await fetch(
    `${RFID_API_BASE_URL}/machines`,
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        institution_id: payload.institution_id,
        institution_name: payload.institution_name,
        recharge_machine_block:
          payload.recharge_machine_block,
        ble_id: payload.ble_id,
        initial_balance: Number(
          payload.initial_balance,
        ),
      }),
    },
  );

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(response),
    );
  }

  const result:
    | ApiResponse<RechargeMachine>
    | RechargeMachine =
    await response.json();

  return unwrapResponse<RechargeMachine>(
    result,
  );
};

// ==========================================
// GET MACHINE BALANCE
//
// GET /machines/:id/balance
// ==========================================

export const getMachineBalance = async (
  machineId: string,
): Promise<MachineBalance> => {
  const response = await fetch(
    `${RFID_API_BASE_URL}/machines/${encodeURIComponent(
      machineId,
    )}/balance`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    },
  );

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(response),
    );
  }

  const result:
    | ApiResponse<MachineBalance>
    | MachineBalance =
    await response.json();

  return unwrapResponse<MachineBalance>(
    result,
  );
};

// ==========================================
// RECHARGE MACHINE
//
// POST /machines/:id/recharge
//
// Request:
//
// {
//   amount: 2000
// }
// ==========================================

export const rechargeMachine = async (
  machineId: string,
  payload: RechargeMachinePayload,
): Promise<RechargeMachine> => {
  const response = await fetch(
    `${RFID_API_BASE_URL}/machines/${encodeURIComponent(
      machineId,
    )}/recharge`,
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        amount: Number(payload.amount),
      }),
    },
  );

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(response),
    );
  }

  const result:
    | ApiResponse<RechargeMachine>
    | RechargeMachine =
    await response.json();

  return unwrapResponse<RechargeMachine>(
    result,
  );
};

// ==========================================
// DELETE MACHINE
//
// DELETE /machines/:id
// ==========================================

export const deleteMachine = async (
  machineId: string,
): Promise<void> => {
  const response = await fetch(
    `${RFID_API_BASE_URL}/machines/${encodeURIComponent(
      machineId,
    )}`,
    {
      method: "DELETE",

      headers: {
        "Content-Type": "application/json",
      },
    },
  );

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(response),
    );
  }
};

// ==========================================
// GET ALL RFID CARDS
//
// GET /rfid/cards
// ==========================================

export const getRFIDCards = async (): Promise<
  RFIDCard[]
> => {
  const response = await fetch(
    `${RFID_API_BASE_URL}/rfid/cards`,
    {
      method: "GET",

      headers: {
        "Content-Type": "application/json",
      },
    },
  );

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(response),
    );
  }

  const result:
    | ApiResponse<RFIDCard[]>
    | RFIDCard[] =
    await response.json();

  return unwrapResponse<RFIDCard[]>(
    result,
  );
};

// ==========================================
// GET RFID CARD DETAILS
//
// GET /rfid/cards/:card_uuid
// ==========================================

export const getRFIDCardById = async (
  cardUuid: string,
): Promise<RFIDCardDetails> => {
  const response = await fetch(
    `${RFID_API_BASE_URL}/rfid/cards/${encodeURIComponent(
      cardUuid,
    )}`,
    {
      method: "GET",

      headers: {
        "Content-Type": "application/json",
      },
    },
  );

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(response),
    );
  }

  const result:
    | ApiResponse<RFIDCardDetails>
    | RFIDCardDetails =
    await response.json();

  return unwrapResponse<RFIDCardDetails>(
    result,
  );
};

// ==========================================
// UPDATE RFID CARD STATUS
//
// PATCH /rfid/cards/:card_uuid/status
// ==========================================

export const updateRFIDCardStatus = async (
  cardUuid: string,
  payload: UpdateCardStatusPayload,
): Promise<RFIDCardDetails> => {
  const response = await fetch(
    `${RFID_API_BASE_URL}/rfid/cards/${encodeURIComponent(
      cardUuid,
    )}/status`,
    {
      method: "PATCH",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify(payload),
    },
  );

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(response),
    );
  }

  const result:
    | ApiResponse<RFIDCardDetails>
    | RFIDCardDetails =
    await response.json();

  return unwrapResponse<RFIDCardDetails>(
    result,
  );
};

// ==========================================
// DELETE RFID CARD
//
// DELETE /rfid/cards/:card_uuid
// ==========================================

export const deleteRFIDCard = async (
  cardUuid: string,
): Promise<void> => {
  const response = await fetch(
    `${RFID_API_BASE_URL}/rfid/cards/${encodeURIComponent(
      cardUuid,
    )}`,
    {
      method: "DELETE",

      headers: {
        "Content-Type": "application/json",
      },
    },
  );

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(response),
    );
  }
};

// ==========================================
// GET RFID CARD HISTORY
//
// GET /rfid/cards/:card_uuid/history
// ==========================================

export const getRFIDCardHistory = async (
  cardUuid: string,
): Promise<RFIDTransaction[]> => {
  const response = await fetch(
    `${RFID_API_BASE_URL}/rfid/cards/${encodeURIComponent(
      cardUuid,
    )}/history`,
    {
      method: "GET",

      headers: {
        "Content-Type": "application/json",
      },
    },
  );

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(response),
    );
  }

  const result:
    | ApiResponse<RFIDTransaction[]>
    | RFIDTransaction[] =
    await response.json();

  return unwrapResponse<RFIDTransaction[]>(
    result,
  );
};

// ==========================================
// GET ALL RFID TRANSACTIONS
//
// GET /rfid/history
// ==========================================

export const getRFIDHistory = async (): Promise<
  RFIDTransaction[]
> => {
  const response = await fetch(
    `${RFID_API_BASE_URL}/rfid/history`,
    {
      method: "GET",

      headers: {
        "Content-Type": "application/json",
      },
    },
  );

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(response),
    );
  }

  const result:
    | ApiResponse<RFIDTransaction[]>
    | RFIDTransaction[] =
    await response.json();

  return unwrapResponse<RFIDTransaction[]>(
    result,
  );
};

// ==========================================
// GET SINGLE TRANSACTION RECEIPT
//
// GET /transactions/:session_id
// ==========================================

export const getTransactionBySessionId = async (
  sessionId: string,
): Promise<RFIDTransaction> => {
  const response = await fetch(
    `${RFID_API_BASE_URL}/transactions/${encodeURIComponent(
      sessionId,
    )}`,
    {
      method: "GET",

      headers: {
        "Content-Type": "application/json",
      },
    },
  );

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(response),
    );
  }

  const result:
    | ApiResponse<RFIDTransaction>
    | RFIDTransaction =
    await response.json();

  return unwrapResponse<RFIDTransaction>(
    result,
  );
};