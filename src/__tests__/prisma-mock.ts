// src/__tests__/prisma-mock.ts
// Deep mock of PrismaClient for unit tests.
//
// USAGE:
//   import { prismaMock } from "@/__tests__/prisma-mock";
//   prismaMock.user.findMany.mockResolvedValue([...]);
//
// This gives you full IntelliSense on every Prisma model method.

import { PrismaClient } from "@prisma/client";
import { DeepMockProxy, mockDeep } from "vitest-mock-extended";

export type MockPrismaClient = DeepMockProxy<PrismaClient>;

export const prismaMock: MockPrismaClient = mockDeep<PrismaClient>();
