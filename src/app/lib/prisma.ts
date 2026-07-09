import { PrismaClient } from "@/generated/prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL must be set to initialize PrismaClient");
}

const url = new URL(databaseUrl);
const host = url.hostname;
const port = url.port ? Number(url.port) : 3306;
const user = url.username;
const password = decodeURIComponent(url.password);
const database = url.pathname.replace(/^\//, "");

const adapter = new PrismaMariaDb({
  host,
  port,
  user,
  password,
  database,
  // 💡 ここを書き換えます
  ssl: {
    minVersion: "TLSv1.2",
    rejectUnauthorized: true,
  },
});

export const prisma =
  global.prisma ||
  new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "development"
        ? [{ level: "query", emit: "event" }]
        : [],
  });

if (process.env.NODE_ENV !== "production") {
  global.prisma = prisma;
}
