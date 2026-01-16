-- Migration: Change id_short from String to auto-increment Integer
-- This will make id_short an auto-incrementing integer field
-- WARNING: This will DELETE existing id_short values and replace them with sequential numbers

BEGIN;

-- ============================================
-- INVOICES TABLE - id_short MIGRATION
-- ============================================

-- Step 1: Drop dependent views/functions first (CASCADE will handle dependencies)
DROP VIEW IF EXISTS "public"."invoice_attributions" CASCADE;
DROP FUNCTION IF EXISTS "public"."invoice_attributions"() CASCADE;

-- Step 2: Drop the unique constraint on id_short
ALTER TABLE "public"."invoices" DROP CONSTRAINT IF EXISTS "unique_short_id";

-- Step 3: Drop the old id_short column
ALTER TABLE "public"."invoices" DROP COLUMN IF EXISTS "id_short";

-- Step 3: Add new integer column with auto-increment using SERIAL
-- SERIAL automatically creates the sequence and sets up the default
ALTER TABLE "public"."invoices" ADD COLUMN "id_short" SERIAL NOT NULL;

-- Step 7: Add unique constraint
ALTER TABLE "public"."invoices" ADD CONSTRAINT "unique_short_id" UNIQUE ("id_short");

COMMIT;

-- Verify the changes
SELECT 
  column_name, 
  data_type, 
  column_default,
  is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'invoices'
  AND column_name = 'id_short';
