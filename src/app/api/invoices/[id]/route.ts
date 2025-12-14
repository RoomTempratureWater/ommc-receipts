import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/database'
import { jwtVerify } from 'jose'

async function getUserIdFromToken(request: NextRequest): Promise<string | null> {
  try {
    const token = request.cookies.get('auth-token')?.value
    if (!token) return null
    
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret')
    const { payload } = await jwtVerify(token, secret)
    return (payload as any).userId
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
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await db.invoices.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: 'Invoice deleted successfully' }, { status: 200 })
  } catch (error) {
    console.error('Error deleting invoice:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
