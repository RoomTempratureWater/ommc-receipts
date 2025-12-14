import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database';
import argon2 from 'argon2';

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();

    // Fetch all hashed keys from DB
    // Note: The 'keys' table is not in the Prisma schema, so this might need to be added
    // For now, we'll use a raw query or create the table
    const keys = await db.$queryRaw`SELECT key FROM keys`;

    // Verify if password matches any stored hash
    for (const hashedKeyObj of keys as any[]) {
      const hashedKey = hashedKeyObj.key;
      const isValid = await argon2.verify(hashedKey, password);
      if (isValid) {
        return NextResponse.json({ error: null, message: true });
      }
    }

    // No match found
    return NextResponse.json({ error: null, message: false });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Unknown error', message: false }, { status: 500 });
  }
}
