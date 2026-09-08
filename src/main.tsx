import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "sonner";
import App from "./App";
import { SudoAuthProvider } from "./context/SudoAuthContext";
import "./index.css";

ReactDOM.createRoot(
  document.getElementById("root")!,
).render(
  <React.StrictMode>
    <BrowserRouter>
      <SudoAuthProvider>
        <App />
        <Toaster
          position="bottom-right"
          richColors
        />
      </SudoAuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
);