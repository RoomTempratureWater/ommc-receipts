import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/database'
import { jwtVerify } from 'jose'

async function getUserFromToken(request: NextRequest): Promise<{ userId: string, role: string } | null> {
  try {
    const token = request.cookies.get('auth-token')?.value
    if (!token) return null
    
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret')
    const { payload } = await jwtVerify(token, secret)
    return { userId: payload.userId as string, role: payload.role as string }
  } catch {
    return null
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserFromToken(request)
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const userId = user.userId;
    const id = BigInt(params.id)

    const member = await db.members.findUnique({
      where: { id }
    })

    if (member) {
      // Serialize BigInt for JSON
      const serializedMember = {
        ...member,
        id: member.id.toString(),
      }

      await db.deleted_records.create({
        data: {
          record_id: member.id.toString(),
          record_type: 'MEMBER',
          record_data: serializedMember as any,
          deleted_by: userId
        } as any
      })
    }

    await db.members.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Member deleted successfully' }, { status: 200 })
  } catch (error) {
    console.error('Error deleting member:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
