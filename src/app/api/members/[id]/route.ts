import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/database'
import jwt from 'jsonwebtoken'

async function getUserIdFromToken(request: NextRequest): Promise<string | null> {
  try {
    const token = request.cookies.get('auth-token')?.value
    if (!token) return null
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any
    return decoded.userId
  } catch {
    return null
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getUserIdFromToken(request)
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
