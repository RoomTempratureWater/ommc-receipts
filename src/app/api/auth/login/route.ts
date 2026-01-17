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
      where: { email }
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

    // Create JWT token using jose
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret')
    const token = await new SignJWT({ userId: user.id, email: user.email })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('7d')
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
      maxAge: 7 * 24 * 60 * 60, // 7 days
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
