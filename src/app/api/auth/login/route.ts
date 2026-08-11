import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/database'
import argon2 from 'argon2'
import { SignJWT } from 'jose'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Find user by email in Supabase auth.users table
    const user = await db.users.findFirst({
      where: { email },
      include: {
        user_roles: true
      }
    })

    if (!user || !user.encrypted_password) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Verify password
    const isValidPassword = await argon2.verify(user.encrypted_password, password)
    
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    const userRole = user.user_roles?.role || 'user';
    const userStatus = user.user_roles?.status || 'active';

    if (userStatus === 'revoked') {
      return NextResponse.json(
        { error: 'Account access has been revoked' },
        { status: 403 }
      )
    }

    // Create JWT token using jose
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret')
    const token = await new SignJWT({ userId: user.id, email: user.email, role: userRole })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('12h')
      .sign(secret)

    // Set HTTP-only cookie
    const response = NextResponse.json(
      { user: { id: user.id, email: user.email } },
      { status: 200 }
    )
    // If you're on http://192.168.x.x, this must be false.
    const isSecureContext = process.env.NODE_ENV === 'production' && 
                            request.nextUrl.protocol === 'https:';

    response.cookies.set('auth-token', token, {
      httpOnly: true,
      // Change this: Only set secure if it's actually HTTPS
      secure: isSecureContext, 
      sameSite: 'lax',
      path: '/'
    })

    return response
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
