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

    // Check if user already exists in Supabase auth.users table
    const existingUser = await db.users.findFirst({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 409 }
      )
    }

    // Hash password
    const hashedPassword = await argon2.hash(password)

    // Create user in Supabase auth.users table
    const user = await db.users.create({
      data: {
        id: crypto.randomUUID(),
        email,
        encrypted_password: hashedPassword,
        email_confirmed_at: new Date(),
        created_at: new Date(),
        updated_at: new Date()
      }
    })

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
      { status: 201 }
    )

    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 // 7 days
    })

    return response
  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
