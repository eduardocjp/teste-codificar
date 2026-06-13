import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../../src/generated/prisma/client";
import { obterDatabaseUrl } from "./env";

declare global {
  var prismaClientChamados: PrismaClient | undefined;
}

const adapter = new PrismaPg(obterDatabaseUrl());

export const prisma =
  globalThis.prismaClientChamados ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalThis.prismaClientChamados = prisma;
}
