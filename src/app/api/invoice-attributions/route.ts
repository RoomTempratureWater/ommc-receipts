import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/database'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const phone = searchParams.get('phone')

    if (!phone) {
      return NextResponse.json(
        { error: 'Phone parameter is required' },
        { status: 400 }
      )
    }

    const attributions = await db.$queryRaw`
      SELECT * FROM invoice_attributions()
      WHERE phone = ${phone}
    `

    return NextResponse.json({ attributions }, { status: 200 })
  } catch (error) {
    console.error('Error fetching invoice attributions:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
