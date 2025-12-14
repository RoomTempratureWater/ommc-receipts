// lib/supabase.ts
// This file is kept for backward compatibility during migration
// All Supabase functionality has been replaced with direct PostgreSQL/Prisma

import { db } from './database'
import { signInWithPassword, signUp, signOut, getUser, getUserSession } from './auth'

// Re-export auth functions for components that still import from supabase
export const supabase = {
  auth: {
    signInWithPassword,
    signUp,
    signOut,
    getUser,
    getSession: getUserSession
  },
  // Database operations will be handled directly through Prisma
  from: (table: string) => {
    // This is a placeholder - components should use db directly
    throw new Error(`Direct database access not supported. Use db.${table} instead.`)
  }
}

