import {
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import SudoRouter from "./router/SudoRouter";

// Import your existing routers here
// import AdminRouter from "./router/AdminRouter";
// import FacultyRouter from "./router/FacultyRouter";

export default function App() {
  return (
    <Routes>

      {/* Existing routes */}

      {/* 
      <Route
        path="/admin/*"
        element={<AdminRouter />}
      />

      <Route
        path="/faculty/*"
        element={<FacultyRouter />}
      />
      */}

      {/* Sudo Admin */}

      <Route
        path="/sudo/*"
        element={<SudoRouter />}
      />

      {/* Default */}

      <Route
        path="/"
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