# Migration: Change id_short to Auto-Increment Integer

This migration changes the `id_short` field in the `invoices` table from an optional String to a required auto-increment Integer.

## Changes Made

### Prisma Schema
- **Before**: `id_short String? @unique(map: "unique_short_id")`
- **After**: `id_short Int @default(autoincrement()) @unique(map: "unique_short_id")`

### Code Updates
- Updated TypeScript types to reflect `id_short` as `number` (required)
- Template code already handles numbers correctly (JavaScript template literals auto-convert)

## Migration Steps

### Option 1: Using Prisma Migrate (Recommended)

1. **Backup your database** (if you have existing data):
   ```bash
   pg_dump -h localhost -U your_user -d your_database > backup.sql
   ```

2. **Create the migration**:
   ```bash
   npx prisma migrate dev --name change_id_short_to_autoincrement --create-only
   ```

3. **Review the generated migration SQL** in `prisma/migrations/[timestamp]_change_id_short_to_autoincrement/migration.sql`

4. **Apply the migration**:
   ```bash
   npx prisma migrate deploy
   ```

### Option 2: Manual SQL Migration

Run the SQL file directly:
```bash
psql -h localhost -U your_user -d your_database -f prisma/migrations/change_id_short_to_autoincrement.sql
```

Or execute the SQL in `prisma/migrations/change_id_short_to_autoincrement.sql` manually.

## After Migration

1. **Regenerate Prisma Client**:
   ```bash
   npx prisma generate
   ```

2. **Verify the changes**:
   - Check that new invoices get auto-incrementing integer `id_short` values
   - Test creating, reading, updating, and deleting invoices
   - Verify that invoice printing still works correctly

## Notes

- The `id` field remains a UUID (unchanged)
- `id_short` is now required (not nullable) and auto-increments
- Existing `id_short` values will be lost and replaced with sequential integers
- The template code automatically converts numbers to strings for display, so no template changes are needed
- All TypeScript types have been updated to reflect `id_short` as a required number

## Production Deployment

To apply this to production:

1. Backup your production database
2. Run the migration SQL on production
3. Regenerate Prisma client: `npx prisma generate`
4. Deploy the updated code
