import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL!;

// Reuse the client across HMR reloads in dev to avoid exhausting connections
declare global {
  // eslint-disable-next-line no-var
  var _pgClient: ReturnType<typeof postgres> | undefined;
}

const client =
  globalThis._pgClient ??
  postgres(connectionString, {
    prepare: false,
    max: 10, // cap pool size; postgres default is 10 per process
  });

if (process.env.NODE_ENV !== "production") {
  globalThis._pgClient = client;
}

export const db = drizzle(client, { schema });
