import {
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import PublicRoute from "./PublicRoute";
import PrivateRoute from "./PrivateRoute";
import SudoLayout from "../components/SudoLayout";

import SudoLogin from "../pages/auth/SudoLogin";
import SudoSignup from "../pages/auth/SudoSignup";

import SudoDashboard from "../pages/sudo/SudoDashboard";
import Institutions from "../pages/sudo/Institution/Institutions";
import InstitutionDetailsPage from "../pages/sudo/Institution/InstitutionDetailsPage";
import Settings from "../pages/sudo/Settings";

import KiosksPage from "../pages/sudo/kiosks/KiosksPage";
import CreateKioskPage from "../pages/sudo/kiosks/CreateKioskPage";
import KioskDetailsPage from "../pages/sudo/kiosks/KioskDetailsPage";
import EditKioskPage from "../pages/sudo/kiosks/EditKioskPage";
import KioskCapabilitiesPage from "../pages/sudo/kiosks/KioskCapabilitiesPage";
import KioskPricingPage from "../pages/sudo/kiosks/KioskPricingPage";
import KioskPrintersPage from "../pages/sudo/kiosks/KioskPrintersPage";
import KioskPairingPage from "../pages/sudo/kiosks/KioskPairingPage";

import MachinesPage from "../pages/sudo/machines/MachinesPage";
import CreateMachinePage from "../pages/sudo/machines/CreateMachinePage";
import MachineDetailsPage from "../pages/sudo/machines/MachineDetailsPage";
import RechargeMachinePage from "../pages/sudo/machines/RechargeMachinePage";
// import CreateUserPage from "../pages/sudo/machines/CreateUserPage";
// import UsersPage from "../pages/sudo/machines/UsersPage";

import RFIDCardsPage from "../pages/sudo/rfid-cards/RFIDCardsPage";
import RFIDCardDetailsPage from "../pages/sudo/rfid-cards/RFIDCardDetailsPage";

import TransactionsPage from "../pages/sudo/transactions/TransactionsPage";

export default function SudoRouter() {
  return (
    <Routes>
      <Route element={<PublicRoute />}>
        <Route
          path="signup"
          element={<SudoSignup />}
        />

        <Route
          path="login"
          element={<SudoLogin />}
        />
      </Route>

      <Route element={<PrivateRoute />}>
        <Route element={<SudoLayout />}>
          <Route
            path="dashboard"
            element={<SudoDashboard />}
          />

          <Route
            path="institutions"
            element={<Institutions />}
          />

          <Route
            path="institutions/:institutionId"
            element={<InstitutionDetailsPage />}
          />

          <Route
            path="kiosks"
            element={<KiosksPage />}
          />

          <Route
            path="kiosks/create"
            element={<CreateKioskPage />}
          />

          <Route
            path="kiosks/:kioskId"
            element={<KioskDetailsPage />}
          />

          <Route
            path="kiosks/:kioskId/edit"
            element={<EditKioskPage />}
          />

          <Route
            path="kiosks/:kioskId/capabilities"
            element={<KioskCapabilitiesPage />}
          />

          <Route
            path="kiosks/:kioskId/pricing"
            element={<KioskPricingPage />}
          />

          <Route
            path="kiosks/:kioskId/printers"
            element={<KioskPrintersPage />}
          />

          <Route
            path="kiosks/:kioskId/pairing"
            element={<KioskPairingPage />}
          />

          <Route
            path="machines"
            element={<MachinesPage />}
          />

          <Route
            path="machines/create"
            element={<CreateMachinePage />}
          />

          <Route
            path="machines/:machineId"
            element={<MachineDetailsPage />}
          />

          <Route
            path="machines/:machineId/recharge"
            element={<RechargeMachinePage />}
          />

          {/* <Route
            path="users"
            element={<UsersPage />}
          />

          <Route
            path="users/create"
            element={<CreateUserPage />}
          /> */}

          <Route
            path="rfid-cards"
            element={<RFIDCardsPage />}
          />

          <Route
            path="rfid-cards/:cardUuid"
            element={<RFIDCardDetailsPage />}
          />

          <Route
            path="transactions"
            element={<TransactionsPage />}
          />

          <Route
            path="settings"
            element={<Settings />}
          />
        </Route>
      </Route>

      <Route
        index
        element={
          <Navigate
            to="/sudo/dashboard"
            replace
          />
        }
      />

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