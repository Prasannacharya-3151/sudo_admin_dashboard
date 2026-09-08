// import type {
//   ApiResponse,
//   SudoAdmin,
//   SudoLoginData,
//   SudoLoginPayload,
//   SudoSignupPayload,
//   SudoLogoutPayload,
// } from "../types/sudo";

// const BASE_URL =
//   "https://dallas-little-shore-suggested.trycloudflare.com/api/v1";

// // ==========================================
// // HELPER
// // ==========================================

// const getErrorMessage = async (
//   response: Response,
// ): Promise<string> => {
//   try {
//     const errorData = await response.json();

//     return (
//       errorData.message ||
//       errorData.error ||
//       "Something went wrong"
//     );
//   } catch {
//     return "Something went wrong";
//   }
// };

// // ==========================================
// // SIGNUP
// // POST /sudo-admin/
// // ==========================================

// export const signupSudo = async (
//   payload: SudoSignupPayload,
// ): Promise<SudoAdmin> => {
//   const response = await fetch(
//     `${BASE_URL}/sudo-admin/`,
//     {
//       method: "POST",

//       headers: {
//         "Content-Type": "application/json",
//       },

//       body: JSON.stringify(payload),
//     },
//   );

//   if (!response.ok) {
//     throw new Error(
//       await getErrorMessage(response),
//     );
//   }

//   const result: ApiResponse<SudoAdmin> =
//     await response.json();

//   return result.data;
// };

// // ==========================================
// // LOGIN
// // POST /sudo-admin/auth/login
// // ==========================================

// export const loginSudo = async (
//   payload: SudoLoginPayload,
// ): Promise<SudoLoginData> => {
//   const response = await fetch(
//     `${BASE_URL}/sudo-admin/auth/login`,
//     {
//       method: "POST",

//       headers: {
//         "Content-Type": "application/json",
//       },

//       body: JSON.stringify(payload),
//     },
//   );

//   if (!response.ok) {
//     throw new Error(
//       await getErrorMessage(response),
//     );
//   }

//   const result: ApiResponse<SudoLoginData> =
//     await response.json();

//   return result.data;
// };

// // ==========================================
// // GET CURRENT SUDO ADMIN
// // GET /sudo-admin/auth/me
// // ==========================================

// export const getSudoProfile = async (
//   accessToken: string,
// ): Promise<SudoAdmin> => {
//   const response = await fetch(
//     `${BASE_URL}/sudo-admin/auth/me`,
//     {
//       method: "GET",

//       headers: {
//         "Content-Type": "application/json",
//         Authorization: `Bearer ${accessToken}`,
//       },
//     },
//   );

//   if (!response.ok) {
//     throw new Error(
//       await getErrorMessage(response),
//     );
//   }

//   const result: ApiResponse<SudoAdmin> =
//     await response.json();

//   return result.data;
// };

// // ==========================================
// // LOGOUT
// // POST /sudo-admin/auth/logout
// // ==========================================

// export const logoutSudo = async (
//   refreshToken: string,
// ): Promise<void> => {
//   const payload: SudoLogoutPayload = {
//     refresh_token: refreshToken,
//   };

//   const response = await fetch(
//     `${BASE_URL}/sudo-admin/auth/logout`,
//     {
//       method: "POST",

//       headers: {
//         "Content-Type": "application/json",
//       },

//       body: JSON.stringify(payload),
//     },
//   );

//   if (!response.ok) {
//     throw new Error(
//       await getErrorMessage(response),
//     );
//   }
// };




import { SUDO_API_BASE_URL } from "./apiConfig";

import type {
  ApiResponse,
  SudoAdmin,
  SudoLoginData,
  SudoLoginPayload,
  SudoSignupPayload,
  SudoLogoutPayload,
} from "../types/sudo";


// ==========================================
// HELPER
// ==========================================

const getErrorMessage = async (
  response: Response,
): Promise<string> => {
  try {
    const errorData = await response.json();

    return (
      errorData.message ||
      errorData.error ||
      "Something went wrong"
    );
  } catch {
    return "Something went wrong";
  }
};


// ==========================================
// SIGNUP
// POST /sudo-admin/
// ==========================================

export const signupSudo = async (
  payload: SudoSignupPayload,
): Promise<SudoAdmin> => {

  const response = await fetch(
    `${SUDO_API_BASE_URL}/sudo-admin/`,
    {
      method: "POST",

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

  const result: ApiResponse<SudoAdmin> =
    await response.json();

  return result.data;
};


// ==========================================
// LOGIN
// POST /sudo-admin/auth/login
// ==========================================

export const loginSudo = async (
  payload: SudoLoginPayload,
): Promise<SudoLoginData> => {

  const response = await fetch(
    `${SUDO_API_BASE_URL}/sudo-admin/auth/login`,
    {
      method: "POST",

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

  const result: ApiResponse<SudoLoginData> =
    await response.json();

  return result.data;
};


// ==========================================
// GET CURRENT SUDO ADMIN
// GET /sudo-admin/auth/me
// ==========================================

export const getSudoProfile = async (
  accessToken: string,
): Promise<SudoAdmin> => {

  const response = await fetch(
    `${SUDO_API_BASE_URL}/sudo-admin/auth/me`,
    {
      method: "GET",

      headers: {
        "Content-Type": "application/json",

        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(response),
    );
  }

  const result: ApiResponse<SudoAdmin> =
    await response.json();

  return result.data;
};


// ==========================================
// LOGOUT
// POST /sudo-admin/auth/logout
// ==========================================

export const logoutSudo = async (
  refreshToken: string,
): Promise<void> => {

  const payload: SudoLogoutPayload = {
    refresh_token: refreshToken,
  };

  const response = await fetch(
    `${SUDO_API_BASE_URL}/sudo-admin/auth/logout`,
    {
      method: "POST",

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
};