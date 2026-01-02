import { ConvexProvider, ConvexReactClient } from "convex/react";
import { ReactNode } from "react";

// Get the Convex URL from environment
const convexUrl = process.env.EXPO_PUBLIC_CONVEX_URL || "http://127.0.0.1:3210";

// Create the Convex client
const convex = new ConvexReactClient(convexUrl);

interface ConvexClientProviderProps {
  children: ReactNode;
}

export function ConvexClientProvider({ children }: ConvexClientProviderProps) {
  return <ConvexProvider client={convex}>{children}</ConvexProvider>;
}

export { convex };
