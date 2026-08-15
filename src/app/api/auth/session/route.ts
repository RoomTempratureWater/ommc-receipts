import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/database'
import { jwtVerify } from 'jose'

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value

    if (!token) {
      return NextResponse.json(
        { user: null },
        { status: 401 }
      )
    }

    // Verify JWT token using jose
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret')
    const { payload } = await jwtVerify(token, secret)
    const decoded = payload as any

    // Get user from Supabase auth.users table
    const user = await db.users.findFirst({
      where: { id: decoded.userId },
      select: { id: true, email: true, created_at: true, user_roles: true }
    })

    if (!user) {
      return NextResponse.json(
        { user: null },
        { status: 401 }
      )
    }

    const role = user.user_roles?.role || 'user';
    const status = user.user_roles?.status || 'active';

    if (status === 'revoked') {
      return NextResponse.json(
        { user: null },
        { status: 401 }
      )
    }

    // Exclude nested user_roles from response and return flattened
    const { user_roles, ...userData } = user;

    return NextResponse.json(
      { user: { ...userData, role } },
      { status: 200 }
    )
  } catch (error) {
    console.error('Session verification error:', error)
    return NextResponse.json(
      { user: null },
      { status: 401 }
    )
  }
}
