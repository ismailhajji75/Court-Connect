import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

import { AuthProvider } from "./hooks/useAuth";
import { BookingsProvider } from "./hooks/useBookings";
import { AvailabilityProvider } from "./hooks/useAvailability";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AuthProvider>
      <BookingsProvider>
        <AvailabilityProvider>
          <App />
        </AvailabilityProvider>
      </BookingsProvider>
    </AuthProvider>
  </React.StrictMode>
);
