import dotenv from "dotenv";
import { z } from "zod";

if (process.env.NODE_ENV === "test") {
  dotenv.config({ path: ".env.test" });
} else {
  dotenv.config();
}

const envSchema = z.object({
  DATABASE_CLIENT: z.enum(["sqlite", "pg"]).default("sqlite"),
  DATABASE_URL: z.string(),
  PORT: z.coerce.number().default(3333),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development")
});

const _env = envSchema.safeParse(process.env);

if (_env.success === false) {
  console.error("❌ Invalid environment variables.", _env.error.format());

  throw new Error("Invalid environment variables.");
}

export const env = _env.data;
