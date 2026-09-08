import {
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import PublicRoute from "./PublicRoute";
import PrivateRoute from "./PrivateRoute";

import SudoLayout from "../components/SudoLayout";

// ==========================================
// AUTH PAGES
// ==========================================

import SudoLogin from "../pages/auth/SudoLogin";
import SudoSignup from "../pages/auth/SudoSignup";

// ==========================================
// SUDO MAIN PAGES
// ==========================================

import SudoDashboard from "../pages/sudo/SudoDashboard";
import Institutions from "../pages/sudo/Institutions";
import Settings from "../pages/sudo/Settings";

// ==========================================
// ADMINISTRATOR PAGES
// ==========================================

import Administrators from "../pages/sudo/administrators/Administrators";

import CreateAdministratorPage from "../pages/sudo/administrators/CreateAdministratorPage";

import AdministratorDetailsPage from "../pages/sudo/administrators/AdministratorDetailsPage";

import EditAdministratorPage from "../pages/sudo/administrators/EditAdministratorPage";

// ==========================================
// KIOSK PAGES
// ==========================================

import KiosksPage from "../pages/sudo/kiosks/KiosksPage";

import CreateKioskPage from "../pages/sudo/kiosks/CreateKioskPage";

import KioskDetailsPage from "../pages/sudo/kiosks/KioskDetailsPage";

import EditKioskPage from "../pages/sudo/kiosks/EditKioskPage";

import KioskCapabilitiesPage from "../pages/sudo/kiosks/KioskCapabilitiesPage";

import KioskPricingPage from "../pages/sudo/kiosks/KioskPricingPage";

import KioskPrintersPage from "../pages/sudo/kiosks/KioskPrintersPage";

import KioskPairingPage from "../pages/sudo/kiosks/KioskPairingPage";

// ==========================================
// RFID MACHINE PAGES
// ==========================================

import MachinesPage from "../pages/sudo/machines/MachinesPage";

import CreateMachinePage from "../pages/sudo/machines/CreateMachinePage";

import MachineDetailsPage from "../pages/sudo/machines/MachineDetailsPage";

import RechargeMachinePage from "../pages/sudo/machines/RechargeMachinePage";

// ==========================================
// RFID CARD PAGES
// ==========================================

import RFIDCardsPage from "../pages/sudo/rfid-cards/RFIDCardsPage";

import RFIDCardDetailsPage from "../pages/sudo/rfid-cards/RFIDCardDetailsPage";

// ==========================================
// TRANSACTION PAGES
// ==========================================

import TransactionsPage from "../pages/sudo/transactions/TransactionsPage";

// ==========================================
// SUDO ROUTER
// ==========================================

export default function SudoRouter() {
  return (
    <Routes>

      {/* ======================================
          PUBLIC ROUTES
      ====================================== */}

      <Route element={<PublicRoute />}>

        {/* ====================================
            SIGNUP
        ==================================== */}

        <Route
          path="signup"
          element={<SudoSignup />}
        />

        {/* ====================================
            LOGIN
        ==================================== */}

        <Route
          path="login"
          element={<SudoLogin />}
        />

      </Route>

      {/* ======================================
          PRIVATE ROUTES
      ====================================== */}

      <Route element={<PrivateRoute />}>

        <Route element={<SudoLayout />}>

          {/* ==================================
              DASHBOARD
          ================================== */}

          <Route
            path="dashboard"
            element={<SudoDashboard />}
          />

          {/* ==================================
              INSTITUTIONS
          ================================== */}

          <Route
            path="institutions"
            element={<Institutions />}
          />

          {/* ==================================
              KIOSK MODULE
          ================================== */}

          {/* ----------------------------------
              ALL KIOSKS

              /sudo/kiosks
          ---------------------------------- */}

          <Route
            path="kiosks"
            element={<KiosksPage />}
          />

          {/* ----------------------------------
              CREATE KIOSK

              /sudo/kiosks/create
          ---------------------------------- */}

          <Route
            path="kiosks/create"
            element={<CreateKioskPage />}
          />

          {/* ----------------------------------
              KIOSK DETAILS

              /sudo/kiosks/:kioskId
          ---------------------------------- */}

          <Route
            path="kiosks/:kioskId"
            element={<KioskDetailsPage />}
          />

          {/* ----------------------------------
              EDIT KIOSK

              /sudo/kiosks/:kioskId/edit
          ---------------------------------- */}

          <Route
            path="kiosks/:kioskId/edit"
            element={<EditKioskPage />}
          />

          {/* ----------------------------------
              KIOSK CAPABILITIES

              /sudo/kiosks/:kioskId/capabilities
          ---------------------------------- */}

          <Route
            path="kiosks/:kioskId/capabilities"
            element={<KioskCapabilitiesPage />}
          />

          {/* ----------------------------------
              KIOSK PRICING

              /sudo/kiosks/:kioskId/pricing
          ---------------------------------- */}

          <Route
            path="kiosks/:kioskId/pricing"
            element={<KioskPricingPage />}
          />

          {/* ----------------------------------
              KIOSK PRINTERS

              /sudo/kiosks/:kioskId/printers
          ---------------------------------- */}

          <Route
            path="kiosks/:kioskId/printers"
            element={<KioskPrintersPage />}
          />

          {/* ----------------------------------
              KIOSK PAIRING

              /sudo/kiosks/:kioskId/pairing
          ---------------------------------- */}

          <Route
            path="kiosks/:kioskId/pairing"
            element={<KioskPairingPage />}
          />

          {/* ==================================
              ADMINISTRATORS MODULE
          ================================== */}

          {/* ----------------------------------
              ALL ADMINISTRATORS

              /sudo/admins
          ---------------------------------- */}

          <Route
            path="admins"
            element={<Administrators />}
          />

          {/* ----------------------------------
              CREATE ADMINISTRATOR

              /sudo/admins/create
          ---------------------------------- */}

          <Route
            path="admins/create"
            element={<CreateAdministratorPage />}
          />

          {/* ----------------------------------
              ADMINISTRATOR DETAILS

              /sudo/admins/:institutionId/:adminId
          ---------------------------------- */}

          <Route
            path="admins/:institutionId/:adminId"
            element={<AdministratorDetailsPage />}
          />

          {/* ----------------------------------
              EDIT ADMINISTRATOR

              /sudo/admins/:institutionId/:adminId/edit
          ---------------------------------- */}

          <Route
            path="admins/:institutionId/:adminId/edit"
            element={<EditAdministratorPage />}
          />

          {/* ==================================
              RFID MACHINES MODULE
          ================================== */}

          {/* ----------------------------------
              ALL MACHINES

              /sudo/machines
          ---------------------------------- */}

          <Route
            path="machines"
            element={<MachinesPage />}
          />

          {/* ----------------------------------
              CREATE MACHINE

              /sudo/machines/create
          ---------------------------------- */}

          <Route
            path="machines/create"
            element={<CreateMachinePage />}
          />

          {/* ----------------------------------
              MACHINE DETAILS

              /sudo/machines/:machineId
          ---------------------------------- */}

          <Route
            path="machines/:machineId"
            element={<MachineDetailsPage />}
          />

          {/* ----------------------------------
              RECHARGE MACHINE

              /sudo/machines/:machineId/recharge
          ---------------------------------- */}

          <Route
            path="machines/:machineId/recharge"
            element={<RechargeMachinePage />}
          />

          {/* ==================================
              RFID CARDS MODULE
          ================================== */}

          {/* ----------------------------------
              ALL RFID CARDS

              /sudo/rfid-cards
          ---------------------------------- */}

          <Route
            path="rfid-cards"
            element={<RFIDCardsPage />}
          />

          {/* ----------------------------------
              RFID CARD DETAILS

              /sudo/rfid-cards/:cardUuid
          ---------------------------------- */}

          <Route
            path="rfid-cards/:cardUuid"
            element={<RFIDCardDetailsPage />}
          />

          {/* ==================================
              TRANSACTIONS MODULE
          ================================== */}

          {/* ----------------------------------
              ALL TRANSACTIONS

              /sudo/transactions
          ---------------------------------- */}

          <Route
            path="transactions"
            element={<TransactionsPage />}
          />

          {/* ==================================
              SETTINGS
          ================================== */}

          <Route
            path="settings"
            element={<Settings />}
          />

        </Route>

      </Route>

      {/* ======================================
          DEFAULT REDIRECT
      ====================================== */}

      <Route
        index
        element={
          <Navigate
            to="/sudo/dashboard"
            replace
          />
        }
      />

      {/* ======================================
          FALLBACK
      ====================================== */}

      <Route
        path="*"
        element={
          <Navigate
            to="/sudo/login"
            replace
          />
        }
      />

    </Routes>
  );
}