import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/database'
import { jwtVerify } from 'jose'
import argon2 from 'argon2'

async function checkAdmin(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value
  if (!token) return false

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret')
    const { payload } = await jwtVerify(token, secret)
    return payload.role === 'admin'
  } catch (e) {
    return false
  }
}

export async function GET(request: NextRequest) {
  if (!(await checkAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  try {
    const users = await db.users.findMany({
      select: {
        id: true,
        email: true,
        created_at: true,
        user_roles: {
          select: {
            role: true,
            status: true
          }
        }
      },
      orderBy: { created_at: 'desc' }
    })

    const mappedUsers = users.map(user => ({
      id: user.id,
      email: user.email,
      created_at: user.created_at,
      role: user.user_roles?.role || 'user',
      status: user.user_roles?.status || 'active'
    }))

    return NextResponse.json(mappedUsers)
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  if (!(await checkAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  try {
    const { userId, role, status, password } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // Upsert user_roles
    const updatedRole = await db.user_roles.upsert({
      where: { user_id: userId },
      update: {
        role: role !== undefined ? role : undefined,
        status: status !== undefined ? status : undefined,
        updated_at: new Date()
      },
      create: {
        user_id: userId,
        role: role || 'user',
        status: status || 'active'
      }
    })

    if (password) {
      const encrypted_password = await argon2.hash(password)
      await db.users.update({
        where: { id: userId },
        data: { encrypted_password }
      })
    }

    return NextResponse.json({ success: true, user_role: updatedRole })
  } catch (error) {
    console.error('Error updating user role:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
