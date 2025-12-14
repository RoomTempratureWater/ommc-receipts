// lib/database.ts
import { PrismaClient } from '@/generated/prisma'

// Create a single instance of Prisma client
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db

// Export types for use in components
export type { Invoice, Expenditure, Member, InvoiceTag, ExpenseTag, InvoiceAttribution, users } from '@/generated/prisma'
