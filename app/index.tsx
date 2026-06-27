import React from "react";
import { LoadingSpinner } from "../src/components/ui/LoadingSpinner";

// Routing is handled centrally by the AuthGuard in app/_layout.tsx.
// This screen just shows a spinner while the guard decides where to send the user.
export default function Index() {
  return <LoadingSpinner fullScreen message="Loading..." />;
}
