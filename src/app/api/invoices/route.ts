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

export async function GET(request: NextRequest) {
  try {
    // TODO: Add authentication back when user auth is implemented
    // const userId = await getUserIdFromToken(request)
    // if (!userId) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }

    const { searchParams } = new URL(request.url)
    const phone = searchParams.get('phone')
    const tagId = searchParams.get('tagId')
    const paymentRef = searchParams.get('paymentRef')
    const paymentType = searchParams.get('paymentType')
    const maxDate = searchParams.get('maxDate')
    const fromDate = searchParams.get('fromDate')
    const onlyPendingCredit = searchParams.get('onlyPendingCredit')
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '50')

    // Build where clause
    const where: any = {}
    
    if (phone) where.phone = phone
    if (tagId && tagId !== '__all__') where.tag = tagId
    if (paymentRef) where.payment_reference = { contains: paymentRef, mode: 'insensitive' }
    if (paymentType && paymentType !== '__all__') where.payment_type = paymentType
    if (maxDate) where.created_at = { lte: new Date(maxDate + 'T23:59:59') }
    if (fromDate) where.created_at = { ...where.created_at, gte: new Date(fromDate + 'T00:00:00') }
    if (onlyPendingCredit === 'true') where.actual_amt_credit_dt = null

    // Allow all users to see all invoices
    const invoices = await db.invoices.findMany({
      where,
      include: { tags: true },
      orderBy: { created_at: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize
    })

    return NextResponse.json({ invoices }, { status: 200 })
  } catch (error) {
    console.error('Error fetching invoices:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // TODO: Add authentication back when user auth is implemented
    // const userId = await getUserIdFromToken(request)
    // if (!userId) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }

    const body = await request.json()
    const invoice = await db.invoices.create({
      data: {
        ...body,
        user_id: null // Set to null instead of invalid UUID string
      },
      include: { tags: true }
    })

    return NextResponse.json({ invoice }, { status: 201 })
  } catch (error) {
    console.error('Error creating invoice:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
