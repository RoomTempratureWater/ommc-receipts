// lib/database.ts
import { PrismaClient } from '@/generated/prisma'

// Create a single instance of Prisma client
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db

// Export types for use in components
export type { invoices as Invoice, expenditures as Expenditure, members as Member, invoice_tags as InvoiceTag, expense_tags as ExpenseTag, users } from '@/generated/prisma'
