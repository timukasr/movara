import { env } from "@/lib/env";
import { ConvexReactClient } from "convex/react";

export const convex = new ConvexReactClient(env.convexUrl);
