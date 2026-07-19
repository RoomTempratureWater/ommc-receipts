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
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const onlyPendingCredit = searchParams.get('onlyPendingCredit')
    const dateFilterMode = searchParams.get('dateFilterMode')
    const email = searchParams.get('email')

    // Build where clause
    const where: any = {}
    
    if (phone) where.phone = phone
    if (tagId && tagId !== '__all__') where.tag = tagId
    if (paymentRef) where.payment_reference = { contains: paymentRef, mode: 'insensitive' }
    if (paymentType && paymentType !== '__all__') where.payment_type = paymentType
    
    // Handle date filtering - support both maxDate/fromDate (InvoiceHistory) and startDate/endDate (BalanceSheet)
    // Use startDate/endDate if provided, otherwise fall back to maxDate/fromDate
    const effectiveStartDate = startDate || fromDate
    const effectiveEndDate = endDate || maxDate
    
    if (dateFilterMode === 'actual') {
      if (effectiveEndDate) {
        where.actual_amt_credit_dt = { ...where.actual_amt_credit_dt, lte: new Date(effectiveEndDate + 'T23:59:59') }
      }
      if (effectiveStartDate) {
        where.actual_amt_credit_dt = { ...where.actual_amt_credit_dt, gte: new Date(effectiveStartDate + 'T00:00:00') }
      }
      // Must not be null if filtering by actual credit date
      if (!where.actual_amt_credit_dt) {
         where.actual_amt_credit_dt = { not: null }
      } else if (!where.actual_amt_credit_dt.not) {
         where.actual_amt_credit_dt.not = null
      }
    } else {
      if (effectiveEndDate) {
        where.created_at = { ...where.created_at, lte: new Date(effectiveEndDate + 'T23:59:59') }
      }
      if (effectiveStartDate) {
        where.created_at = { ...where.created_at, gte: new Date(effectiveStartDate + 'T00:00:00') }
      }
    }

    if (onlyPendingCredit === 'true') where.actual_amt_credit_dt = null

    if (email) {
      where.users = {
        email: { contains: email, mode: 'insensitive' }
      }
    }

    // Allow all users to see all invoices
    const invoices = await db.invoices.findMany({
      where,
      include: {
        tags: true,
        users: { select: { email: true } }
      },
      orderBy: { id_short: 'desc' }
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
    const userId = await getUserIdFromToken(request)

    const body = await request.json()
    // Exclude id_short from the data since it's auto-increment
    const { id_short, ...invoiceData } = body
    const invoice = await db.invoices.create({
      data: {
        ...invoiceData,
        user_id: userId || null
      },
      include: { tags: true }
    })

    return NextResponse.json({ invoice }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating invoice:', error)
    // Return more detailed error for debugging
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error?.message || 'Unknown error',
        code: error?.code
      },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    // TODO: Add authentication back when user auth is implemented
    // const userId = await getUserIdFromToken(request)
    // if (!userId) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }

    const body = await request.json()
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }

    const invoice = await db.invoices.update({
      where: { id },
      data: updateData,
      include: { tags: true }
    })

    return NextResponse.json({ invoice }, { status: 200 })
  } catch (error: any) {
    console.error('Error updating invoice:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error?.message || 'Unknown error'
      },
      { status: 500 }
    )
  }
}
