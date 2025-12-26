import { hc } from "hono/client";
import type { route } from "./index";

export type AppType = typeof route;
export type Client = ReturnType<typeof hc<AppType>>;

export const hcWithType = (...args: Parameters<typeof hc>): Client =>
  hc<AppType>(...args);