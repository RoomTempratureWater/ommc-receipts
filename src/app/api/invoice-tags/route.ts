import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/database'

export async function GET() {
  try {
    const tags = await db.invoice_tags.findMany({
      select: { tag_id: true, tag_name: true }
    })

    return NextResponse.json({ tags }, { status: 200 })
  } catch (error) {
    console.error('Error fetching invoice tags:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
