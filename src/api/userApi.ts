import { RFID_API_BASE_URL } from "./apiConfig";

import type {
  ApiResponse,
  SignupUserPayload,
  SignupUserResponse,
  WardenUser,
} from "../types/user";

const getErrorMessage = async (
  response: Response,
): Promise<string> => {
  try {
    const errorData: unknown =
      await response.json();

    console.error(
      "API Error Response:",
      errorData,
    );

    if (
      typeof errorData === "object" &&
      errorData !== null &&
      "detail" in errorData
    ) {
      const detail = (
        errorData as {
          detail?: unknown;
        }
      ).detail;

      if (Array.isArray(detail)) {
        return detail
          .map((item: unknown) => {
            if (
              typeof item !== "object" ||
              item === null
            ) {
              return "Validation error";
            }

            const validationItem =
              item as {
                loc?: unknown;
                msg?: unknown;
              };

            const field =
              Array.isArray(
                validationItem.loc,
              )
                ? validationItem.loc
                    .filter(
                      (location: unknown) =>
                        location !== "body",
                    )
                    .map((location: unknown) =>
                      String(location),
                    )
                    .join(".")
                : "";

            const message =
              typeof validationItem.msg ===
              "string"
                ? validationItem.msg
                : "Invalid value";

            return field
              ? `${field}: ${message}`
              : message;
          })
          .join(", ");
      }

      if (
        typeof detail === "string"
      ) {
        return detail;
      }
    }

    if (
      typeof errorData === "object" &&
      errorData !== null &&
      "message" in errorData
    ) {
      const message = (
        errorData as {
          message?: unknown;
        }
      ).message;

      if (typeof message === "string") {
        return message;
      }
    }

    if (
      typeof errorData === "object" &&
      errorData !== null &&
      "error" in errorData
    ) {
      const error = (
        errorData as {
          error?: unknown;
        }
      ).error;

      if (typeof error === "string") {
        return error;
      }
    }

    if (response.status === 409) {
      return "Email already registered";
    }

    if (response.status === 404) {
      return "Not found";
    }

    return `Request failed with status ${response.status}`;
  } catch {
    if (response.status === 409) {
      return "Email already registered";
    }

    if (response.status === 404) {
      return "Not found";
    }

    return `Request failed with status ${response.status}`;
  }
};

const unwrapResponse = <T>(
  result: ApiResponse<T> | T,
): T => {
  if (
    typeof result === "object" &&
    result !== null &&
    "data" in result
  ) {
    const data = (
      result as ApiResponse<T>
    ).data;

    if (data !== undefined) {
      return data;
    }
  }

  return result as T;
};

export const signupUser = async (
  payload: SignupUserPayload,
): Promise<SignupUserResponse> => {
  const response = await fetch(
    `${RFID_API_BASE_URL}/auth/signup`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        institution_id:
          payload.institution_id,
        institution_name:
          payload.institution_name,
        email: payload.email,
        password: payload.password,
      }),
    },
  );

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(response),
    );
  }

  const result:
    | ApiResponse<SignupUserResponse>
    | SignupUserResponse =
    await response.json();

  return unwrapResponse<SignupUserResponse>(
    result,
  );
};

export const getUsers = async (): Promise<
  WardenUser[]
> => {
  const response = await fetch(
    `${RFID_API_BASE_URL}/users`,
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
    | ApiResponse<WardenUser[]>
    | WardenUser[] =
    await response.json();

  return unwrapResponse<WardenUser[]>(
    result,
  );
};

export const deleteUser = async (
  userId: string,
): Promise<void> => {
  const response = await fetch(
    `${RFID_API_BASE_URL}/users/${encodeURIComponent(
      userId,
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