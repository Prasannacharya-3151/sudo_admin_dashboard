import {
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import SudoRouter from "./router/SudoRouter";


export default function App() {
  return (
    <Routes>
      <Route
        path="/sudo/*"
        element={<SudoRouter />}
      />
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