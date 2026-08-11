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

export async function GET(request: NextRequest) {
  try {
    // TODO: Add authentication back when user auth is implemented
    // const userId = await getUserIdFromToken(request)
    // if (!userId) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const tags = searchParams.get('tags')
    const paymentRef = searchParams.get('paymentRef')
    const onlyPendingCredit = searchParams.get('onlyPendingCredit')
    const dateFilterMode = searchParams.get('dateFilterMode')
    const email = searchParams.get('email')
    
    // New filters
    const id = searchParams.get('id')
    const title = searchParams.get('title')
    const paymentType = searchParams.get('paymentType')
    const minAmount = searchParams.get('minAmount')
    const maxAmount = searchParams.get('maxAmount')
    const recordStartDate = searchParams.get('recordStartDate')
    const recordEndDate = searchParams.get('recordEndDate')

    // Build where clause
    const where: any = {}
    
    // Filter by date field (the expenditure date), not actual_amt_credit_dt unless dateFilterMode=actual
    if (dateFilterMode === 'actual') {
      if (startDate) where.actual_amt_credit_dt = { gte: new Date(startDate) }
      if (endDate) where.actual_amt_credit_dt = { ...where.actual_amt_credit_dt, lte: new Date(endDate) }
      // Must not be null if filtering by actual credit date
      if (!where.actual_amt_credit_dt) {
         where.actual_amt_credit_dt = { not: null }
      } else if (!where.actual_amt_credit_dt.not) {
         where.actual_amt_credit_dt.not = null
      }
    } else {
      if (startDate) where.date = { gte: new Date(startDate) }
      if (endDate) where.date = { ...where.date, lte: new Date(endDate) }
    }
    
    if (recordEndDate) {
      where.created_at = { ...where.created_at, lte: new Date(recordEndDate + 'T23:59:59') }
    }
    if (recordStartDate) {
      where.created_at = { ...where.created_at, gte: new Date(recordStartDate + 'T00:00:00') }
    }
    
    if (tags) {
      const tagArray = tags.split(',').filter(t => t.trim())
      if (tagArray.length) where.tag = { in: tagArray }
    }
    if (paymentRef) where.payment_reference = { contains: paymentRef, mode: 'insensitive' }
    if (onlyPendingCredit === 'true') where.actual_amt_credit_dt = null

    if (email) {
      where.users = {
        email: { contains: email, mode: 'insensitive' }
      }
    }
    
    // Add new filters
    if (id) where.id = { startsWith: id }
    if (title) where.title = { contains: title, mode: 'insensitive' }
    if (paymentType && paymentType !== '__all__') where.payment_type = paymentType
    
    if (minAmount || maxAmount) {
      where.amount = {}
      if (minAmount) where.amount.gte = parseFloat(minAmount)
      if (maxAmount) where.amount.lte = parseFloat(maxAmount)
    }

    const expenditures = await db.expenditures.findMany({
      where,
      include: {
        tags: true,
        users: { select: { email: true } }
      },
      orderBy: { date: 'desc' }
    })

    return NextResponse.json({ expenditures }, { status: 200 })
  } catch (error) {
    console.error('Error fetching expenditures:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromToken(request)
    const userId = user?.userId

    const body = await request.json()
    const expenditure = await db.expenditures.create({
      data: {
        ...body,
        user_id: userId || null
      },
      include: { tags: true }
    })

    return NextResponse.json({ expenditure }, { status: 201 })
  } catch (error) {
    console.error('Error creating expenditure:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
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

    const expenditure = await db.expenditures.update({
      where: { id },
      data: updateData,
      include: { tags: true }
    })

    return NextResponse.json({ expenditure }, { status: 200 })
  } catch (error) {
    console.error('Error updating expenditure:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // TODO: Add authentication back when user auth is implemented
    // const userId = await getUserIdFromToken(request)
    // if (!userId) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }

    const user = await getUserFromToken(request)
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const userId = user.userId
    
    const expenditure = await db.expenditures.findUnique({
      where: { id }
    })

    if (expenditure) {
      await db.deleted_records.create({
        data: {
          record_id: expenditure.id,
          record_type: 'EXPENDITURE',
          record_data: JSON.parse(JSON.stringify(expenditure)),
          deleted_by: userId
        } as any
      })
    }

    await db.expenditures.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Expenditure deleted successfully' }, { status: 200 })
  } catch (error) {
    console.error('Error deleting expenditure:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
