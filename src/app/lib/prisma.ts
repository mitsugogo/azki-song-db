import { PrismaClient } from "@/generated/prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
  // eslint-disable-next-line no-var
  var prismaSchemaVersion: string | undefined;
}

const PRISMA_SCHEMA_VERSION = "playlist-visibility-v2";

export const getPrisma = () => {
  if (global.prisma && global.prismaSchemaVersion === PRISMA_SCHEMA_VERSION) {
    return global.prisma;
  }
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL must be set to initialize PrismaClient");
  }
  const url = new URL(databaseUrl);
  const adapter = new PrismaMariaDb({
    host: url.hostname,
    port: url.port ? Number(url.port) : 3306,
    user: url.username,
    password: decodeURIComponent(url.password),
    database: url.pathname.replace(/^\//, ""),
    ssl: { minVersion: "TLSv1.2", rejectUnauthorized: true },
  });
  const client = new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "development"
        ? [{ level: "query", emit: "event" }]
        : [],
  });
  if (process.env.NODE_ENV !== "production") {
    global.prisma = client;
    global.prismaSchemaVersion = PRISMA_SCHEMA_VERSION;
  }
  return client;
};

// 既存の呼び出し側との互換性を保ちつつ、実体は最初のアクセスまで生成しない。
export const prisma = new Proxy({} as PrismaClient, {
  get: (_target, property) => {
    const client = getPrisma();
    const value = Reflect.get(client, property);
    return typeof value === "function" ? value.bind(client) : value;
  },
});
