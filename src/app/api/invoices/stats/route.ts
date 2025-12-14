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

export async function GET(request: NextRequest) {
  try {
    // TODO: Add authentication back when user auth is implemented
    // const userId = await getUserIdFromToken(request)
    // if (!userId) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const phone = searchParams.get('phone')
    const tagId = searchParams.get('tagId')
    const fromDate = searchParams.get('fromDate')
    const toDate = searchParams.get('toDate')

    if (type === 'monthly') {
      // Get monthly totals
      const from = new Date(fromDate || '2020-01-01')
      const to = toDate ? new Date(toDate) : new Date()
      
      const data = await db.$queryRaw`
        SELECT * FROM get_monthly_totals(
          ${from.toISOString()}::timestamp,
          ${phone?.trim() || null}::text,
          ${!tagId || tagId === '__all__' ? null : tagId}::uuid,
          ${to.toISOString()}::date
        )
      `

      return NextResponse.json({ data }, { status: 200 })
    } else if (type === 'total') {
      // Get invoice total
      const data = await db.$queryRaw`
        SELECT get_invoice_total(
          ${phone?.trim() || null}::text,
          ${!tagId || tagId === '__all__' ? null : tagId}::uuid,
          ${toDate ? new Date(toDate).toISOString() : null}::date
        ) as total
      `

      return NextResponse.json({ data }, { status: 200 })
    } else if (type === 'balance') {
      // Get net balance by payment type
      const endDateParam = searchParams.get('endDate')
      if (!endDateParam) {
        return NextResponse.json(
          { error: 'endDate parameter is required for balance type' },
          { status: 400 }
        )
      }
      
      const data = await db.$queryRaw`
        SELECT * FROM get_net_balance_by_payment_type(${new Date(endDateParam).toISOString()}::date)
      `

      return NextResponse.json({ data }, { status: 200 })
    } else {
      return NextResponse.json(
        { error: 'Type parameter must be "monthly", "total", or "balance"' },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Error fetching invoice stats:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
