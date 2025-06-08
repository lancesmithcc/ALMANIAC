"use client";

import { SessionProvider } from "next-auth/react";
import React from "react";

interface SessionProviderWrapperProps {
  children: React.ReactNode;
}

export default function SessionProviderWrapper({
  children,
}: SessionProviderWrapperProps) {
  return (
    <SessionProvider 
      // Refetch session every 5 minutes
      refetchInterval={5 * 60}
      // Re-fetch session if window is focused
      refetchOnWindowFocus={true}
    >
      {children}
    </SessionProvider>
  );
} 