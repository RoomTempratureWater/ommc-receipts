import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/database'

export async function GET(request: NextRequest) {
  try {
    const deletedRecords = await db.deleted_records.findMany({
      orderBy: { deleted_at: 'desc' },
      include: {
        users: {
          select: { email: true }
        }
      }
    })

    return NextResponse.json({ records: deletedRecords }, { status: 200 })
  } catch (error) {
    console.error('Error fetching recycle bin records:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
