import { RFID_API_BASE_URL } from "./apiConfig";

import type {
  CreateMachinePayload,
  MachineBalance,
  RechargeMachine,
  RechargeMachinePayload,
  RFIDCard,
  RFIDCardDetails,
  RFIDTransaction,
  UpdateCardStatusPayload,
  InstitutionMembersResponse,
} from "../types/machine";

// ==========================================
// HELPERS
// ==========================================

async function getErrorMessage(
  response: Response,
): Promise<string> {
  try {
    const body = await response.json();

    if (Array.isArray(body?.detail)) {
      return body.detail
        .map((item: any) => item?.msg)
        .filter(Boolean)
        .join(", ");
    }

    if (typeof body?.detail === "string") {
      return body.detail;
    }

    if (typeof body?.message === "string") {
      return body.message;
    }

    if (typeof body?.error === "string") {
      return body.error;
    }
  } catch {
    // Ignore invalid JSON
  }

  return `Request failed with status ${response.status}`;
}

async function unwrapResponse<T>(
  response: Response,
): Promise<T> {
  if (!response.ok) {
    throw new Error(
      await getErrorMessage(response),
    );
  }

  const body = await response.json();

  if (
    body &&
    typeof body === "object" &&
    "data" in body
  ) {
    return body.data as T;
  }

  return body as T;
}

// ==========================================
// MACHINES
// ==========================================

export async function getMachines(): Promise<
  RechargeMachine[]
> {
  const response = await fetch(
    `${RFID_API_BASE_URL}/machines`,
  );

  return unwrapResponse<RechargeMachine[]>(
    response,
  );
}

export async function createMachine(
  payload: CreateMachinePayload,
): Promise<RechargeMachine> {
  const response = await fetch(
    `${RFID_API_BASE_URL}/machines`,
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify(payload),
    },
  );

  return unwrapResponse<RechargeMachine>(
    response,
  );
}

export async function getMachineBalance(
  machineId: string,
): Promise<MachineBalance> {
  const response = await fetch(
    `${RFID_API_BASE_URL}/machines/${encodeURIComponent(
      machineId,
    )}/balance`,
  );

  return unwrapResponse<MachineBalance>(
    response,
  );
}

export async function rechargeMachine(
  machineId: string,
  payload: RechargeMachinePayload,
): Promise<RechargeMachine> {
  const response = await fetch(
    `${RFID_API_BASE_URL}/machines/${encodeURIComponent(
      machineId,
    )}/recharge`,
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify(payload),
    },
  );

  return unwrapResponse<RechargeMachine>(
    response,
  );
}

export async function deleteMachine(
  machineId: string,
): Promise<void> {
  const response = await fetch(
    `${RFID_API_BASE_URL}/machines/${encodeURIComponent(
      machineId,
    )}`,
    {
      method: "DELETE",
    },
  );

  await unwrapResponse<unknown>(response);
}

// ==========================================
// RFID CARDS
// ==========================================

export async function getRFIDCards(): Promise<
  RFIDCard[]
> {
  const response = await fetch(
    `${RFID_API_BASE_URL}/rfid/cards`,
  );

  return unwrapResponse<RFIDCard[]>(
    response,
  );
}

export async function getRFIDCardById(
  cardUuid: string,
): Promise<RFIDCardDetails> {
  const response = await fetch(
    `${RFID_API_BASE_URL}/rfid/cards/${encodeURIComponent(
      cardUuid,
    )}`,
  );

  return unwrapResponse<RFIDCardDetails>(
    response,
  );
}

export async function updateRFIDCardStatus(
  cardUuid: string,
  payload: UpdateCardStatusPayload,
): Promise<RFIDCardDetails> {
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

  return unwrapResponse<RFIDCardDetails>(
    response,
  );
}

export async function deleteRFIDCard(
  cardUuid: string,
): Promise<void> {
  const response = await fetch(
    `${RFID_API_BASE_URL}/rfid/cards/${encodeURIComponent(
      cardUuid,
    )}`,
    {
      method: "DELETE",
    },
  );

  await unwrapResponse<unknown>(response);
}

// ==========================================
// RFID HISTORY
// ==========================================

export async function getRFIDCardHistory(
  cardUuid: string,
): Promise<RFIDTransaction[]> {
  const response = await fetch(
    `${RFID_API_BASE_URL}/rfid/cards/${encodeURIComponent(
      cardUuid,
    )}/history`,
  );

  return unwrapResponse<RFIDTransaction[]>(
    response,
  );
}

export async function getRFIDHistory(): Promise<
  RFIDTransaction[]
> {
  const response = await fetch(
    `${RFID_API_BASE_URL}/rfid/history`,
  );

  return unwrapResponse<RFIDTransaction[]>(
    response,
  );
}

export async function getTransactionBySessionId(
  sessionId: string,
): Promise<RFIDTransaction> {
  const response = await fetch(
    `${RFID_API_BASE_URL}/transactions/${encodeURIComponent(
      sessionId,
    )}`,
  );

  return unwrapResponse<RFIDTransaction>(
    response,
  );
}

// ==========================================
// INSTITUTION MEMBERS
// ==========================================
//
// GET:
// /institutions/members?institution_id=UUID
//
// Used to determine which students belong
// to the selected institution.
//
// ==========================================

export async function getInstitutionMembers(
  institutionId: string,
): Promise<InstitutionMembersResponse> {
  const params = new URLSearchParams({
    institution_id: institutionId,
  });

  const response = await fetch(
    `${RFID_API_BASE_URL}/institutions/members?${params.toString()}`,
  );

  return unwrapResponse<InstitutionMembersResponse>(
    response,
  );
}